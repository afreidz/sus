import {
  Peer,
  type PeerOptions,
  type DataConnection,
  type MediaConnection,
} from "peerjs";

import {
  mute,
  SessionTranscriber,
  combineMediaStreams,
  recordSessionStream,
  combineCameraStreams,
  uploadImageToStorage,
  captureImageFromStream,
} from "@/helpers/media";

import api from "@/helpers/api";
import { deepMap } from "nanostores";
import type { APIResponses } from "@/helpers/api";
import type { SessionSchema } from "@/pages/api/sessions/schema";

const PEER_OPTS: PeerOptions = import.meta.env.DEV
  ? {
      host: "localhost",
      port: 1999,
      path: "/sessions",
    }
  : {};

export const RECORDING_OPTS: MediaRecorderOptions = {
  mimeType: "video/webm;codecs=vp9",
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 2500000,
};

type PushURLMessage = {
  type: "push-url";
  url: string;
};

type RecordingStartMessage = {
  type: "recording-start";
};

type RecordingStopMessage = {
  type: "recording-stop";
};

type TranscriptionMessage = {
  type: "transcription";
  transcription: Transcription;
};

export type DataMessage =
  | PushURLMessage
  | RecordingStartMessage
  | RecordingStopMessage
  | TranscriptionMessage;

export type Transcription = Pick<
  APIResponses["sessionId"]["GET"]["transcripts"][number],
  "text" | "time"
> & {
  speaker?: "host" | "participant";
};

export type Moment = Pick<
  APIResponses["sessionId"]["GET"]["moments"][number],
  "text" | "time"
>;

export type SessionRecording = {
  end?: Date;
  start: Date;
  moments?: Moment[];
  videoURL?: string;
  transcript?: Transcription[];
  videoPromise?: Promise<string>;
};

type Session = {
  id?: string;
  host?: boolean;

  connections: {
    peer?: Peer;
    data?: DataConnection;
    camera?: MediaConnection;
    screen?: MediaConnection;
    recorder?: MediaRecorder;
    transcriber?: SessionTranscriber;
  };

  local: {
    id?: string;
    name?: string;
    camera?: MediaStream;
    screen?: MediaStream;
    composite?: MediaStream;
  };

  remote: {
    id?: string;
    name?: string;
    camera?: MediaStream;
    screen?: MediaStream;
    composite?: MediaStream;
  };

  status: {
    connected: boolean;
    recording: boolean;
    initialized: boolean;
  };

  moments: Moment[];
  recordingStart?: Date;
  video?: Promise<string>;
  transcript: Transcription[];
};

const session = deepMap<Session>({
  local: {},
  remote: {},
  moments: [],
  transcript: [],
  connections: {},
  status: {
    connected: false,
    recording: false,
    initialized: false,
  },
});

export async function initLocalCamera(size: number) {
  const video: MediaStreamConstraints["video"] = {
    frameRate: 30,
    aspectRatio: 1,
    facingMode: "user",
    height: { ideal: size },
  };

  const audio: MediaStreamConstraints["audio"] = {
    sampleRate: 128000,
    channelCount: 2,
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio,
    video,
  });

  session.setKey("local.camera", stream);
  return stream;
}

export async function initScreenShare() {
  const video: MediaStreamConstraints["video"] = {
    frameRate: 30,
    aspectRatio: 16 / 9,
    width: { ideal: 1280 },
  };

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video,
    audio: false,
    preferCurrentTab: true,
  } as any);

  session.setKey("local.screen", stream);
  return stream;
}

export async function initTranscriber() {
  const transcriber = new SessionTranscriber();
  session.setKey("connections.transcriber", transcriber);

  const sess = session.get();
  if (sess.host) {
    transcriber.on("speech", (transcription: Transcription) => {
      const { transcript } = session.get();
      transcription.speaker = "host";
      transcription.time = new Date(transcription.time);

      if (transcription.text) transcript.push(transcription);
      session.setKey("transcript", [...transcript]);
    });

    sess.connections.data?.on("data", (data: unknown) => {
      const msg = data as DataMessage;
      if (msg.type === "transcription") {
        const sess = session.get();

        const transcript = sess.transcript ?? [];
        msg.transcription.speaker = "participant";
        msg.transcription.time = new Date(msg.transcription.time);

        if (msg.transcription.text) transcript.push(msg.transcription);
        session.setKey("transcript", [...transcript]);
      }
    });
  } else {
    transcriber.on("speech", (transcription) => {
      sess.connections.data?.send({
        type: "transcription",
        transcription,
      });
    });
  }
}

export async function connectAsParticipant(
  participant: APIResponses["respondentId"]["GET"]
) {
  console.log("Initializing Participant Session...");

  const hostId = `host${participant.revisionId}host`;
  const participantId = `participant${participant.id}participant`;

  session.setKey("host", false);
  session.setKey("remote.id", hostId);
  session.setKey("local.name", participant.email);
  session.setKey("remote.name", participant.revision.createdBy);

  const existing = session.get();

  if (!existing.connections.peer?.open) {
    const peer = new Peer(`participant${participant.id}participant`, PEER_OPTS);
    session.setKey("connections.peer", peer);

    console.log("Waiting for connection to open...");
    const pid = await new Promise<string | undefined>((r) => {
      peer.once("open", r);
    });

    if (!pid || participantId !== pid)
      throw new Error(
        `Expected session id to be: ${participantId}. Recieved session id: ${pid}`
      );

    console.log("Connected:", pid);
    session.setKey("local.id", pid);
  }
  session.setKey("status.initialized", true);
}

export async function connectAsHost(
  participant: APIResponses["respondentId"]["GET"]
) {
  console.log("Initializing Host Session...");

  const peerId = `host${participant.revision.id}host`;

  session.setKey("host", true);
  session.setKey("local.id", peerId);
  session.setKey("remote.id", participant.id);
  session.setKey("remote.name", participant.email);
  session.setKey("local.name", participant.revision.createdBy);

  const existing = session.get();

  if (!existing.connections.peer?.open) {
    const peer = new Peer(peerId, PEER_OPTS);
    session.setKey("connections.peer", peer);

    console.log("Waiting for connection to open...");
    const pid = await new Promise<string | undefined>((r) => {
      peer.once("open", r);
    });

    if (!pid || peerId !== pid)
      throw new Error(
        `Expected session id to be: ${peerId}. Recieved session id: ${pid}`
      );

    console.log("Connected:", pid);
    session.setKey("local.id", pid);
    session.setKey("status.initialized", true);
  }

  const {
    local,
    connections: { peer },
  } = session.get();

  if (!peer) throw new Error(`Unable to connect to session`);

  console.log("Waiting on peer to establish connections...");
  peer.off("call");
  peer.off("connection");

  await new Promise((r) => {
    peer.on("connection", (connection) => {
      session.setKey("connections.data", connection);
      connection.once("open", () => {
        console.log("Data connection established.");
        r(true);
      });
    });
  });

  await new Promise((r) => {
    peer.on("call", (connection) => {
      if (connection.metadata.type === "camera") {
        connection.answer(local.camera);
        session.setKey(`connections.camera`, connection);
        connection.once("stream", async (media) => {
          session.setKey("remote.camera", media);
          console.log(`Camera connection established`);
          r(true);
        });
      }
    });
  });

  await new Promise((r) => {
    peer.on("call", (connection) => {
      if (connection.metadata.type === "screen") {
        connection.answer();
        session.setKey(`connections.screen`, connection);
        connection.once("stream", (media) => {
          console.log(`Screen connection established`);
          session.setKey("remote.screen", media);
          r(true);
        });
      }
    });
  });

  const body: Partial<SessionSchema> = {
    clips: [],
    moments: [],
    transcript: [],
    respondentId: participant.id,
  };

  const dbSession = await api({
    method: "POST",
    endpoint: "sessions",
    body: JSON.stringify(body),
  });

  const { remote } = session.get();

  if (remote.camera) {
    // Update respondent image
    const imageBlob = await captureImageFromStream(remote.camera);
    const imageURL = await uploadImageToStorage(
      imageBlob,
      "participant-images",
      `image-${participant.id}.jpeg`
    );

    await api({
      method: "PUT",
      endpoint: "respondentId",
      body: JSON.stringify({ imageURL }),
      substitutions: { respondentId: participant.id },
    });
  }

  session.setKey("id", dbSession.id);
  session.setKey("status.connected", true);
}

export async function callHost(
  type: "data" | "camera" | "screen",
  media?: MediaStream
) {
  if (type !== "data" && !media)
    throw new Error(`Cannot call host with ${type} media`);

  const { connections, remote, local } = session.get();
  const { peer } = connections;

  if (!peer?.open || !remote.id)
    throw new Error("Unable to connect to session");

  console.log(`Calling host for ${type} connection...`);
  if (type === "data") {
    await new Promise((r) => {
      const call = peer.connect(remote.id as string);
      session.setKey("connections.data", call);
      call.once("open", () => r(true));
    });
    console.log(`Data connection established`);
  } else if (type === "camera" && media) {
    await new Promise(async (r) => {
      const call = peer.call(remote.id as string, media, {
        metadata: { type },
      });
      session.setKey(`connections.${type}`, call);
      call.on("stream", (media) => {
        if (local.camera) {
          const clone = mute(local.camera);
          combineCameraStreams(clone, media, 500).then((composite) => {
            session.setKey("local.composite", composite);
          });
          console.log(`Camera connection established`);
          r(true);
        }
      });
    });
  } else if (type === "screen" && media) {
    await new Promise(async (r) => {
      const call = peer.call(remote.id as string, mute(media), {
        metadata: { type },
      });
      session.setKey(`connections.${type}`, call);
      console.log(`Screen connection established`);
      r(true);
      call.on("stream", console.log);
    });
  }

  if (
    connections.camera &&
    connections.data &&
    connections.screen &&
    connections.transcriber
  ) {
    session.setKey("status.connected", true);
  }
}

export async function startRecording() {
  const { id, local, remote, status, host, connections } = session.get();

  if (status.recording) return;

  if (!host) throw new Error("Only the host is able to record");

  if (!local.camera || !remote.camera || !remote.screen)
    throw new Error(`All media is not ready to record`);

  const stream = await combineMediaStreams(
    remote.screen,
    remote.camera,
    local.camera
  );

  const recorder = new MediaRecorder(stream, RECORDING_OPTS);

  connections.transcriber?.start();
  connections.data?.send({ type: "recording-start" });

  session.setKey("status.recording", true);
  session.setKey("recordingStart", new Date());
  session.setKey("connections.recorder", recorder);

  const promise = recordSessionStream(recorder, `session-${id}`);
  session.setKey("video", promise);
}

export async function stopRecording() {
  const { connections, video, remote, transcript, moments, id, local } =
    session.get();

  if (!connections.recorder) throw new Error("Unable to locate recorder");

  connections.recorder.stop();
  connections.transcriber?.stop();

  session.setKey("status.recording", false);
  session.setKey("recordingStart", undefined);
  connections.data?.send({ type: "recording-stop" });

  const url = await video;

  if (!id || !remote.id || !local.name)
    throw new Error("Unable to update the session in the database");

  const updateBody: SessionSchema = {
    video: url,
    createdBy: local.name,
    respondentId: remote.id,
    moments: moments.map((m) => ({
      text: m.text,
      time: m.time.toISOString(),
    })),
    transcript: transcript.map((t) => ({
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
