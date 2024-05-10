import {
  initMic,
  initScreenShare,
  initLocalCamera,
  combineCameraStreams,
  uploadImageToStorage,
  captureImageFromStream,
} from "@/helpers/media";

import {
  Features,
  type Call,
  CallClient,
  LocalAudioStream,
  LocalVideoStream,
  VideoStreamRenderer,
  type RemoteVideoStream,
  type RemoteParticipant,
  type RecordingCallFeature,
  type VideoStreamRendererView,
} from "@azure/communication-calling";

import { v4 as uuid } from "uuid";
import { deepMap } from "nanostores";
import api, { type APIResponses } from "@/helpers/api";
import { type SessionSchema } from "@/pages/api/sessions/schema";
import Messenger, { type DataMessage } from "@/helpers/messenger";
import { SessionTranscriber, type Transcription } from "@/helpers/transcribe";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

export type Moment = Pick<
  APIResponses["sessionId"]["GET"]["moments"][number],
  "text" | "time"
>;

type Session = {
  id: string;
  isConnected: boolean;
  respondent?: APIResponses["respondentId"]["GET"];

  local: {
    call?: Call;
    name?: string;
    mic?: MediaStream;
    moments?: Moment[];
    messenger?: Messenger;
    screen?: LocalVideoStream;
    transcript?: Transcription[];
    role?: "host" | "participant";
    camera?: VideoStreamRendererView;
    transcriber?: SessionTranscriber;
    cameras?: MediaStream | MediaProvider;
  };

  remote: {
    name?: string;
    mic?: MediaStream;
    camera?: VideoStreamRendererView;
    screen?: VideoStreamRendererView;
  };

  recording: {
    id?: String;
    start?: Date;
    isRecording?: boolean;
    recorder?: RecordingCallFeature;
  };
};

const session = deepMap<Session>({
  id: uuid(),
  local: {},
  remote: {},
  recording: {},
  isConnected: false,
});
export type SessionStore = typeof session;

export async function connect(
  id: string,
  role: "host" | "participant",
  respondent: APIResponses["respondentId"]["GET"]
) {
  console.log("Connecting to session...");
  if (session.get().isConnected) return console.log("connected.");

  //=======================================
  //
  // Set the metadata of the user
  //
  //=======================================
  session.setKey("local.role", role);
  session.setKey("respondent", respondent);
  session.setKey(
    "local.name",
    role === "host" ? respondent.revision.createdBy : respondent.email
  );
  console.log("session metadata set");

  //=======================================
  //
  // Initialize the call agent
  //
  //=======================================
  const { token } = await api({ endpoint: "comsToken", method: "GET" });
  const client = new CallClient();
  const credential = new AzureCommunicationTokenCredential(token);
  const agent = await client.createCallAgent(credential, {
    displayName: session.get().local.name,
  });
  console.log("call agent initialized");

  //=======================================
  //
  // Initialize devices (camera/mic)
  //
  //=======================================
  const devices = await client.getDeviceManager();
  devices.askDevicePermission({ video: true, audio: true });

  const camera =
    role === "host"
      ? await initLocalCamera(360)
      : (await devices.getCameras())[0];
  const cameraStream = new LocalVideoStream(camera as MediaStream);

  const mic = await initMic();
  const micStream = new LocalAudioStream(mic);

  const renderer = new VideoStreamRenderer(cameraStream);
  const view = await renderer.createView({
    scalingMode: "Fit",
    isMirrored: false,
  });

  session.setKey("local.camera", view);

  if (role === "participant") {
    const screen = await initScreenShare();
    const screenStream = new LocalVideoStream(screen);
    session.setKey("local.screen", screenStream);
  }
  console.log("devices initialized");

  //=======================================
  //
  // Join the call
  //
  //=======================================
  const call = agent.join({ groupId: id });
  await callConnected(call);
  await call.startAudio(micStream);
  await call.startVideo(cameraStream);
  if (role === "participant") {
    const screen = session.get().local.screen;
    (call.startScreenSharing as (s?: LocalVideoStream) => Promise<void>)(
      screen
    );
  }
  session.setKey("local.call", call);
  console.log("remote call initialized");

  //=======================================
  //
  // Initialize call recording
  //
  //=======================================
  if (role === "host") {
    const recorder = call.feature(Features.Recording);
    session.setKey("recording.recorder", recorder);

    recorder.on("isRecordingActiveChanged", () => {
      const active = recorder.isRecordingActive;
      messenger?.send({ type: active ? "recording-start" : "recording-stop" });
      session.setKey("recording.isRecording", active);
    });
  }

  //=======================================
  //
  // Initialize data messaging channel
  //
  //=======================================
  const messenger = new Messenger(call);
  console.log("data messenger initialized");
  session.setKey("local.messenger", messenger);

  //=======================================
  //
  // Initialize transcription
  //
  //=======================================
  const transcriber = new SessionTranscriber();
  session.setKey("local.transcriber", transcriber);

  if (role === "host") {
    messenger.on("message", (msg: DataMessage) => {
      if (msg?.type === "transcription") {
        const sess = session.get();
        const transcript = sess.local.transcript ?? [];

        msg.transcription.speaker = "participant";
        msg.transcription.time = new Date(msg.transcription.time);

        if (msg.transcription.text) transcript.push(msg.transcription);
        session.setKey("local.transcript", [...transcript]);
      }
    });
  }

  transcriber.on("speech", (transcription: Transcription) => {
    if (role === "host") {
      const { local } = session.get();
      const transcript = local.transcript ?? [];

      transcription.speaker = "host";
      transcription.time = new Date(transcription.time);

      if (transcription.text) transcript.push(transcription);
      session.setKey("local.transcript", [...transcript]);
    } else {
      messenger.send({
        type: "transcription",
        transcription,
      });
    }
  });
  console.log("session transcription initialized");

  //===================================================
  //
  // Initialize handlers for session member changes
  //
  //===================================================
  if (role === "host") {
    if (call.remoteParticipants.length)
      await handleChangeFromHost({
        added: [call.remoteParticipants[0]],
        removed: [],
      });

    call.on("remoteParticipantsUpdated", handleChangeFromHost);
  } else if (role === "participant") {
    if (call.remoteParticipants.length)
      await handleChangeFromParticipant({
        added: [call.remoteParticipants[0]],
        removed: [],
      });

    call.on("remoteParticipantsUpdated", handleChangeFromParticipant);
  }
  console.log("session handlers registered");

  //=======================================
  //
  // Set connected status
  //
  //=======================================
  session.setKey("isConnected", true);
  console.log("connected.");
}

function callConnected(call: Call) {
  return new Promise((r) => {
    if (call.state === "Connected") r(true);
    call.on("stateChanged", () => {
      if (call.state === "Connected") r(true);
    });
  });
}

function mediaAvailable(
  stream?: RemoteVideoStream,
  timeout = 10000
): Promise<RemoteVideoStream | undefined> {
  let timer: ReturnType<typeof setTimeout>;
  return new Promise((r) => {
    if (!stream) return r(undefined);
    if (stream.isAvailable) {
      clearTimeout(timer);
      return r(stream);
    }
    timer = setTimeout(() => r(undefined), timeout);
    stream.on("isAvailableChanged", () => {
      if (stream.isAvailable) {
        clearTimeout(timer);
        r(stream);
      }
    });
  });
}

async function handleChangeFromHost({
  added,
  removed,
}: {
  added: RemoteParticipant[];
  removed: RemoteParticipant[];
}) {
  if (removed.length) session.setKey("remote", {});

  const participant = added[0];
  if (!participant || participant.state !== "Connected") return;

  session.setKey("remote.name", participant.displayName);

  const remoteCamera = await mediaAvailable(
    participant.videoStreams.find((s) => s.mediaStreamType === "Video")
  );
  if (!remoteCamera?.isAvailable) return;

  const camRenderer = new VideoStreamRenderer(remoteCamera);
  const camView = await camRenderer.createView({
    scalingMode: "Crop",
    isMirrored: false,
  });
  session.setKey("remote.camera", camView);

  const remoteScreen = await mediaAvailable(
    participant.videoStreams.find((s) => s.mediaStreamType === "ScreenSharing")
  );
  if (!remoteScreen?.isAvailable)
    throw new Error("Could not connect to screen share");

  const screenRenderer = new VideoStreamRenderer(remoteScreen);
  const screenView = await screenRenderer.createView({
    scalingMode: "Fit",
    isMirrored: false,
  });

  session.setKey("remote.screen", screenView);

  const remoteMic = await mediaAvailable(
    participant.videoStreams.find((s) => s.mediaStreamType === "Audio")
  );
  if (remoteMic) session.setKey("remote.mic", await remoteMic.getMediaStream());

  const {
    id,
    respondent,
    local: { messenger },
  } = session.get();

  messenger?.send({ type: "ping" });

  if (id && respondent) {
    const body: Partial<SessionSchema> = {
      id,
      clips: [],
      moments: [],
      transcript: [],
      respondentId: respondent.id,
    };

    const dbSession = await api({
      method: "POST",
      endpoint: "sessions",
      body: JSON.stringify(body),
    });

    session.setKey("id", dbSession.id);
  }

  if (remoteCamera && respondent) {
    // Update respondent image
    const imageBlob = await captureImageFromStream(
      await remoteCamera.getMediaStream()
    );
    const imageURL = await uploadImageToStorage(
      imageBlob,
      "participant-images",
      `image-${respondent.id}.jpeg`
    );

    await api({
      method: "PUT",
      endpoint: "respondentId",
      body: JSON.stringify({ imageURL }),
      substitutions: { respondentId: respondent.id },
    });
  }
}

async function handleChangeFromParticipant({
  added,
  removed,
}: {
  added: RemoteParticipant[];
  removed: RemoteParticipant[];
}) {
  if (removed.length) session.setKey("remote", {});
  const host = added[0];

  session.setKey("remote.name", host.displayName);

  const remoteCamera = await mediaAvailable(
    host.videoStreams.find((s) => s.mediaStreamType === "Video")
  );
  if (!remoteCamera?.isAvailable) return;

  const { local } = session.get();
  const localCameraStream =
    local.camera?.target.querySelector("video")?.srcObject;
  const remoteCameraStream = await remoteCamera.getMediaStream();

  if (!localCameraStream) throw new Error("Could not get local camera");

  const combinedCameras = await combineCameraStreams(
    localCameraStream,
    remoteCameraStream,
    500
  );
  session.setKey("local.cameras", combinedCameras);
}

export async function startRecording() {
  const { id, local, recording } = session.get();

  if (recording.isRecording) return;

  if (local.role !== "host") throw new Error("Only the host is able to record");
  if (!local.call?.id) throw new Error("Call ID not found");

  const serverCallId = await (local.call as any).info.getServerCallId();

  const resp = await api({
    method: "POST",
    endpoint: "recordSession",
    body: JSON.stringify({
      action: "start",
      serverCallId,
      sessionId: id,
    }),
  });

  local.transcriber?.start();
  session.setKey("recording.start", new Date());
  session.setKey("recording.id", resp.recordingId);
}

export async function stopRecording() {
  const { id, local, recording, respondent } = session.get();

  if (!recording.recorder || !recording.id)
    throw new Error("Unable to locate recorder/call");

  await api({
    method: "POST",
    endpoint: "recordSession",
    body: JSON.stringify({
      action: "stop",
      recordingId: recording.id,
    }),
  });

  local.transcriber?.stop();

  session.setKey("recording.start", undefined);
  session.setKey("recording.isRecording", false);
  local.messenger?.send({ type: "recording-stop" });

  if (!id || !respondent)
    throw new Error("Unable to update the session in the database");

  const updateBody: SessionSchema = {
    respondentId: respondent.id,
    createdBy: respondent.revision.createdBy,
    moments: local.moments?.map((m) => ({
      text: m.text,
      time: m.time.toISOString(),
    })),
    transcript: local.transcript?.map((t) => ({
      text: t.text,
      time: t.time.toISOString(),
      speaker: t.speaker ?? "participant",
    })),
  };

  await api({
    method: "PUT",
    endpoint: "sessionId",
    body: JSON.stringify(updateBody),
    substitutions: { sessionId: id },
  });
}

export default session;
