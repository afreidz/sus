import {
  Peer,
  type PeerOptions,
  type DataConnection,
  type MediaConnection,
} from "peerjs";

import { deepMap } from "nanostores";
import {
  combineCameraStreams,
  combineMediaStreams,
  initLocalCamera,
} from "@/helpers/media";

const opts: MediaRecorderOptions = { mimeType: "video/webm;codecs=vp9" };

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

export type SessionRecording = {
  end?: Date;
  start: Date;
  file?: File;
};

type Session = {
  id?: string;
  peer?: Peer;
  host?: string;
  timestamp: Date;

  composite?: MediaStream;

  cameras: {
    muted?: MediaStream;
    remote?: MediaStream;
    unmuted?: MediaStream;
    composite?: MediaStream;
  };

  screen?: MediaStream;

  recorder: {
    current?: SessionRecording;
    mediaRecorder?: MediaRecorder;
    status?: MediaRecorder["state"];
    recordings?: SessionRecording[];
  };

  connections: {
    data?: DataConnection;
    camera?: MediaConnection;
    screen?: MediaConnection;
  };
};

const session = deepMap<Session>({
  timestamp: new Date(),
  connections: {},
  cameras: {},
  recorder: {},
});

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
    let timeout;
    const pid = await new Promise<string | undefined>((r) => {
      peer.once("open", r);
      timeout = setTimeout(() => {
        r(undefined);
        peer.off("open", r);
      }, 10000);
    });
    clearTimeout(timeout);

    if (!pid || id !== pid)
      throw new Error(
        `Expected session id to be: ${id}. Recieved session id: ${existing.id}`
      );

    console.log("Peer connected.", pid);
    existing.id = pid;
  }

  const { peer, cameras } = session.get();
  const isHost = !!existing.id && existing.id === existing.host;

  if (!peer) throw new Error(`Unable to connect to session`);

  if (isHost) {
    console.log("Waiting on peer to establish connections...");
    peer.off("call");
    peer.off("connection");
    peer.on("connection", (connection) => {
      session.setKey("connections.data", connection);
      connection.once("open", () => {
        console.log("Data connection established.");
      });
    });
    peer.on("call", (connection) => {
      if (connection.metadata.type === "camera") {
        if (!!cameras?.unmuted) {
          connection.answer(cameras.unmuted);
        } else {
          initLocalCamera(500).then((streams) => {
            session.setKey("cameras.muted", streams.muted);
            session.setKey("cameras.unmuted", streams.unmuted);
            connection.answer(streams.unmuted);
          });
        }
        session.setKey(`connections.camera`, connection);
        console.log(`Camera connection established`);
        connection.once("stream", async (media) => {
          session.setKey("cameras.remote", media);
        });
      }
      if (connection.metadata.type === "screen") {
        connection.answer();
        session.setKey(`connections.screen`, connection);
        console.log(`Screen connection established`);
        connection.once("stream", (media) => {
          session.setKey("screen", media);
        });
      }
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

  const { peer, host, cameras } = session.get();

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
        if (cameras.muted)
          combineCameraStreams(cameras.muted, media, 500).then((composite) => {
            session.setKey("cameras.composite", composite);
          });
        r(true);
      });
    });
    console.log(`Camera connection established`);
  } else if (type === "screen" && media) {
    await new Promise(async (r) => {
      const call = peer.call(host, media, { metadata: { type } });
      session.setKey(`connections.${type}`, call);
      call.on("stream", async (media) => {
        session.setKey("screen", media);
        r(true);
      });
    });
    console.log(`Screen connection established`);
  }
}

export async function startRecording() {
  const s = session.get();
  const recording: SessionRecording = {
    start: new Date(),
  };

  if (s.id !== s.host) throw new Error("Only the host is able to record");

  if (!s.screen || !s.cameras.remote || !s.cameras.unmuted)
    throw new Error(`All media is not ready to record`);

  const recorder =
    s.recorder.mediaRecorder ||
    new MediaRecorder(
      await combineMediaStreams(s.screen, s.cameras.remote, s.cameras.unmuted),
      opts
    );

  if (!s.recorder.mediaRecorder) {
    session.setKey("recorder.mediaRecorder", recorder);
  }

  let chunks: BlobPart[] = [];
  recorder.addEventListener("dataavailable", (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  });

  recorder.addEventListener("stop", () => {
    if (!recorder.mimeType)
      throw new Error("Unable to save recording due to missing MIME type");
    const blob = new Blob(chunks, { type: recorder.mimeType });
    const file = new File([blob], `${s.host}_recording_${+Date.now()}.webm`, {
      type: blob.type,
      lastModified: Date.now(),
    });

    recording.file = file;
    recording.end = new Date();
    session.setKey("recorder.recordings", [
      ...(s.recorder.recordings ?? []),
      recording,
    ]);
  });

  recorder.start(500);
  session.setKey("recorder.current", recording);
  session.setKey("recorder.status", recorder.state);
}

export function stopRecording() {
  const { recorder } = session.get();

  if (!recorder.mediaRecorder) throw new Error("Unable to locate recorder");

  recorder.mediaRecorder?.stop();
  session.setKey("recorder.current", undefined);
  session.setKey("recorder.status", recorder.mediaRecorder.state);
}

export default session;
