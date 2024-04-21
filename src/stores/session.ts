import {
  Peer,
  type PeerOptions,
  type DataConnection,
  type MediaConnection,
} from "peerjs";

import { deepMap } from "nanostores";
import { initLocalCamera } from "@/helpers/media";

const PEER_OPTS: PeerOptions = import.meta.env.DEV
  ? {
      host: "localhost",
      port: 1999,
      path: "/sessions",
    }
  : {};

export const RECORDING_OPTS: MediaRecorderOptions = {
  audioBitsPerSecond: 128000,
  videoBitsPerSecond: 2500000,
  mimeType: "video/webm",
};

const RECORDING_TIMESLICE_MS = 200;

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

  media: {
    local?: {
      camera?: {
        muted?: MediaStream;
        unmuted?: MediaStream;
      };
      screen?: MediaStream;
    };
    remote?: {
      camera?: MediaStream;
      screen?: MediaStream;
    };
    composite?: MediaStream;
  };

  record: {
    ready?: boolean;
    recording: boolean;
    recorder?: MediaRecorder;
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
  record: {
    ready: false,
    recording: false,
  },
  media: {},
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

  const { peer, media } = session.get();
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
        if (!!media.local?.camera?.unmuted) {
          connection.answer(media.local.camera.unmuted);
        } else {
          initLocalCamera(500).then((streams) => {
            session.setKey("media.local.camera.muted", streams.muted);
            session.setKey("media.local.camera.unmuted", streams.unmuted);
            connection.answer(streams.unmuted);
          });
        }
        session.setKey(`connections.camera`, connection);
        console.log(`Camera connection established`);
        connection.once("stream", (media) => {
          session.setKey("media.remote.camera", media);
        });
      }
      if (connection.metadata.type === "screen") {
        connection.answer();
        session.setKey(`connections.screen`, connection);
        console.log(`Screen connection established`);
        connection.once("stream", (media) => {
          session.setKey("media.remote.screen", media);
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

  const { peer, host } = session.get();

  if (!peer?.open || !host) throw new Error("Unable to connect to session");

  console.log(`Calling host for ${type} connection...`);
  if (type === "data") {
    await new Promise((r) => {
      const call = peer.connect(host);
      session.setKey("connections.data", call);
      call.once("open", () => r(true));
    });
    console.log(`${type} connection established`);
  }

  if (type !== "data" && media) {
    await new Promise(async (r) => {
      const call = peer.call(host, media, { metadata: { type } });
      session.setKey(`connections.${type}`, call);
      call.on("stream", (media) => {
        session.setKey(`media.remote.${type}`, media);
        r(true);
      });
    });
    console.log(`${type} connection established`);
  }
}

export function startRecording() {
  const s = session.get();

  if (s.id !== s.host) throw new Error("Only the host is able to record");

  if (!s.record.ready || !s.record.recorder || !s.media.composite)
    throw new Error(`Record is not in a "ready" state`);

  const chunks: BlobPart[] = [];
  const recording: SessionRecording = {
    start: new Date(),
  };

  s.record.recorder.ondataavailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  s.record.recorder.onstop = () => {
    if (!s.record.recorder?.mimeType)
      throw new Error("Unable to save recording due to missing MIME type");
    const blob = new Blob(chunks, { type: s.record.recorder.mimeType });
    const file = new File([blob], `${s.host}_recording_${+Date.now()}.webm`, {
      type: blob.type,
      lastModified: Date.now(),
    });

    recording.file = file;
    recording.end = new Date();
    session.setKey("record.recordings", [
      ...(s.record.recordings ?? []),
      recording,
    ]);
  };

  session.setKey("record.recording", true);
  s.record.recorder.start(RECORDING_TIMESLICE_MS);
}

export function stopRecording() {
  session.get().record.recorder?.stop();
}

export default session;
