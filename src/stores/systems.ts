import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";

const systems = atom<null | APIResponses["systems"]["GET"]>(null);

export async function refreshSystems() {
  systems.set(await api({ endpoint: "systems", method: "GET" }));
}

export default systems;
