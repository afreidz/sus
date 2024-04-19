import {
  Peer,
  type PeerOptions,
  type DataConnection,
  type MediaConnection,
} from "peerjs";

import { computed, deepMap } from "nanostores";

const PEER_OPTS: PeerOptions = import.meta.env.DEV
  ? {
      host: "localhost",
      port: 1999,
      path: "/sessions",
    }
  : {};

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
  };

  recorder?: MediaRecorder;

  connections: {
    data?: DataConnection;
    camera?: MediaConnection;
    screen?: MediaConnection;
  };
};

const session = deepMap<Session>({
  timestamp: new Date(),
  connections: {},
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
        if (!media.local?.camera?.unmuted) {
          console.log("No stream available to answer participant camera call.");
        }
        connection.answer(media.local?.camera?.unmuted);
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
    await new Promise((r) => {
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

export default session;
