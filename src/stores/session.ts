import { atom } from "nanostores";
import { Peer, type PeerOptions } from "peerjs";

const PEER_OPTS: PeerOptions = {
  //host: "localhost",
  //port: 1999,
  //path: "/sessions"
};

const connection = atom<null | Peer>(null);

export async function connect(id?: string, host?: boolean) {
  const existing = connection.get();
  if (existing) return existing;

  connection.set(id ? new Peer(id, PEER_OPTS) : new Peer(PEER_OPTS));

  const c = connection.get();

  if (c) c.on("open", (id) => console.log(`Connected to session as: ${id}`));

  return connection.get();
}

export default connection;
