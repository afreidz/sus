import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";

const clients = atom<null | APIResponses["clients"]["GET"]>(null);

export async function refreshClients() {
  clients.set(await api({ endpoint: "clients", method: "GET" }));
}

export default clients;
