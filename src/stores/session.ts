import {
  Peer,
  type PeerOptions,
  type DataConnection,
  type MediaConnection,
} from "peerjs";

import { deepMap } from "nanostores";

import {
  SessionTranscriber,
  combineMediaStreams,
  recordSessionStream,
  combineCameraStreams,
} from "@/helpers/media";

const PEER_OPTS: PeerOptions = import.meta.env.DEV
  ? {
      host: "localhost",
      port: 1999,
      path: "/sessions",
    }
  : {};

export const RECORDING_TIMESLICE_MS = 200;
export const RECORDING_OPTS: MediaRecorderOptions = {
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 2500000,
  mimeType: "video/webm",
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

export type Transcription = {
  text: string;
  timestamp: Date;
  speaker?: "host" | "participant";
};

export type Moment = {
  time: Date;
  note: string;
};

export type SessionRecording = {
  end?: Date;
  start: Date;
  video?: File;
  moments?: Moment[];
  transcript?: Transcription[];
};

type Session = {
  id?: string;
  peer?: Peer;
  host?: string;
  timestamp: Date;

  streams: {
    cameras?: {
      local?: MediaStream;
      remote?: MediaStream;
      composite?: MediaStream;
    };
    screen?: MediaStream;
  };

  recorder: {
    current?: SessionRecording;
    mediaRecorder?: MediaRecorder;
    status?: "recording" | "idle";
    recordings?: SessionRecording[];
  };

  transcriber?: SessionTranscriber;

  connections: {
    data?: DataConnection;
    camera?: MediaConnection;
    screen?: MediaConnection;
  };
};

const session = deepMap<Session>({
  timestamp: new Date(),
  connections: {},
  streams: {},
  recorder: {},
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

  session.setKey("streams.cameras.local", stream);
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

  session.setKey("streams.screen", stream);
  return stream;
}

export async function initTranscriber() {
  const transcriber = new SessionTranscriber();
  session.setKey("transcriber", transcriber);

  const sess = session.get();
  if (sess.host === sess.id) {
    transcriber.on("speech", (transcription) => {
      const {
        recorder: { current },
      } = session.get();
      transcription.speaker = "host";
      transcription.timestamp = new Date(transcription.timestamp);

      const transcript = current?.transcript ?? [];

      if (transcription.text) transcript.push(transcription);
      session.setKey("recorder.current.transcript", [...transcript]);
    });

    sess.connections.data?.on("data", (data: unknown) => {
      const msg = data as DataMessage;
      if (msg.type === "transcription") {
        const sess = session.get();
        if (!sess.recorder.current) return;

        const transcript = sess.recorder.current.transcript ?? [];
        msg.transcription.speaker = "participant";
        msg.transcription.timestamp = new Date(msg.transcription.timestamp);

        if (msg.transcription.text) transcript.push(msg.transcription);
        session.setKey("recorder.current.transcript", [...transcript]);
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

export async function connect(id: string, host: string) {
  console.log("Initializing Session...");
  const existing = session.get();

  session.setKey("id", id);
  session.setKey("host", host);

  existing.id = id;
  existing.host = host;

  if (!existing.peer?.open) {
    const peer = new Peer(id, PEER_OPTS);
    session.setKey("peer", peer);

    console.log("Checking for open peer connection...");
    const pid = await new Promise<string | undefined>((r) => {
      peer.once("open", r);
    });

    if (!pid || id !== pid)
      throw new Error(
        `Expected session id to be: ${id}. Recieved session id: ${existing.id}`
      );

    console.log("Peer connected.", pid);
    existing.id = pid;
  }

  const { peer, streams } = session.get();
  const isHost = !!existing.id && existing.id === existing.host;

  if (!peer) throw new Error(`Unable to connect to session`);

  if (isHost) {
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
          connection.answer(streams.cameras?.local);
          session.setKey(`connections.camera`, connection);
          connection.once("stream", async (media) => {
            session.setKey("streams.cameras.remote", media);
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
            session.setKey("streams.screen", media);
            r(true);
          });
        }
      });
    });
  }
  session.setKey("timestamp", new Date());
}

export async function callHost(
  type: "data" | "camera" | "screen",
  media?: MediaStream
) {
  if (type !== "data" && !media)
    throw new Error(`Cannot call host with ${type} media`);

  const { peer, host, streams } = session.get();

  if (!peer?.open || !host) throw new Error("Unable to connect to session");

  console.log(`Calling host for ${type} connection...`);
  if (type === "data") {
    await new Promise((r) => {
      const call = peer.connect(host);
      session.setKey("connections.data", call);
      call.once("open", () => r(true));
    });
    console.log(`Data connection established`);
  } else if (type === "camera" && media) {
    await new Promise(async (r) => {
      const call = peer.call(host, media, { metadata: { type } });
      session.setKey(`connections.${type}`, call);
      call.on("stream", (media) => {
        if (streams.cameras?.local) {
          const clone = streams.cameras.local.clone();
          clone.getAudioTracks().forEach((t) => t.stop());
          combineCameraStreams(clone, media, 500).then((composite) => {
            session.setKey("streams.cameras.composite", composite);
          });
          console.log(`Camera connection established`);
          r(true);
        }
      });
    });
  } else if (type === "screen" && media) {
    await new Promise(async (r) => {
      media.getAudioTracks().forEach((t) => t.stop());
      const call = peer.call(host, media, { metadata: { type } });
      session.setKey(`connections.${type}`, call);
      console.log(`Screen connection established`);
      r(true);
      call.on("stream", console.log);
    });
  }
}

export async function startRecording() {
  const s = session.get();

  if (s.recorder.status === "recording") return;

  if (s.id !== s.host) throw new Error("Only the host is able to record");

  if (
    !s.streams.screen ||
    !s.streams.cameras?.remote ||
    !s.streams.cameras?.local
  )
    throw new Error(`All media is not ready to record`);

  const options: MediaRecorderOptions = {
    mimeType: "video/webm;codecs=vp9",
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
  };

  const stream = await combineMediaStreams(
    s.streams.screen,
    s.streams.cameras.remote,
    s.streams.cameras.local
  );

  const recorder = new MediaRecorder(stream, options);
  const recording: SessionRecording = { start: new Date() };

  session.setKey("recorder.current", recording);
  session.setKey("recorder.status", "recording");
  session.setKey("recorder.mediaRecorder", recorder);
  s.connections.data?.send({ type: "recording-start" });

  recordSessionStream(recorder, `session_recording_${+new Date()}`).then(
    (video) => {
      if (video) recording.video = video;
      recording.end = new Date();

      session.setKey("recorder.recordings", [
        ...(s.recorder.recordings ?? []),
        recording,
      ]);
      session.setKey("recorder.status", "idle");
    }
  );
}

export function stopRecording() {
  const { recorder, transcriber, connections } = session.get();

  if (!recorder.mediaRecorder) throw new Error("Unable to locate recorder");

  recorder.mediaRecorder.stop();
  session.setKey("recorder.current", undefined);
  connections.data?.send({ type: "recording-stop" });

  if (!transcriber) return;
  transcriber.stop();
}

export default session;
