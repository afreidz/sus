import { atom } from "nanostores";
import { Peer, type PeerOptions } from "peerjs";

const PEER_OPTS: PeerOptions = import.meta.env.DEV
  ? {
      host: "localhost",
      port: 1999,
      path: "/sessions",
    }
  : {};

const session = atom<null | Peer>(null);

export async function connect(id?: string, host?: boolean) {
  const existing = session.get();
  if (existing) return existing;

  const connection = id ? new Peer(id, PEER_OPTS) : new Peer(PEER_OPTS);

  await new Promise((r) =>
    connection.on("open", (id) => {
      console.log(`Connected to session as: ${id}`);
      r(id);
    })
  );

  session.set(connection);

  return session.get();
}

export default session;
