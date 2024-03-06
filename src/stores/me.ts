import api from "@/helpers/api";
import type { APIResponses } from "@/api/types";
import { atom, onMount, task } from "nanostores";

const me = atom<null | APIResponses["me"]["GET"]>(null);

onMount(me, () => {
  task(refreshMe);
});

export async function refreshMe() {
  const account = await api({ endpoint: "me" });
  me.set(account);
}

export default me;
