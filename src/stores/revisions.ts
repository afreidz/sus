import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";

const revisions = atom<null | APIResponses["revisions"]["GET"]>(null);

export async function refreshRevisions() {
  revisions.set(await api({ endpoint: "revisions", method: "GET" }));
}

export default revisions;
