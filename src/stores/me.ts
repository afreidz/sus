import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";

const me = atom<null | APIResponses["me"]["GET"]>(null);

export async function refreshMe() {
  const account = await api({ endpoint: "me" });
  me.set(account);
  return account;
}

export default me;
