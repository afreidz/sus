import api from "@/helpers/api";
import type { APIResponses } from "@/api/types";
import { task, onMount, atom } from "nanostores";

const revisions = atom<null | APIResponses["revisionAll"]["GET"]>(null);

onMount(revisions, () => {
  task(refreshRevisions);
});

export async function refreshRevisions() {
  revisions.set(await api({ endpoint: "revisionAll", method: "GET" }));
}

export default revisions;
