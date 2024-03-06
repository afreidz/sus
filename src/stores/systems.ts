import api from "@/helpers/api";
import type { APIResponses } from "@/api/types";
import { atom, onMount, task } from "nanostores";

const systems = atom<null | APIResponses["systemAll"]["GET"]>(null);

onMount(systems, () => {
  task(refreshSystems);
});

export async function refreshSystems() {
  systems.set(await api({ endpoint: "systemAll", method: "GET" }));
}

export default systems;
