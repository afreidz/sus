import api from "@/helpers/api";
import { writable } from "svelte/store";
import type { APIResponses } from "@/api/types";

const me = writable<null | APIResponses["me"]["GET"]>(null, () => {
  refreshMe();
});

export async function refreshMe() {
  const account = await api({ endpoint: "me" });
  me.set(account);
}

export default me;
