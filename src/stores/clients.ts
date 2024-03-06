import api from "@/helpers/api";
import type { APIResponses } from "@/api/types";
import { atom, onMount, task } from "nanostores";

const clients = atom<null | APIResponses["clientAll"]["GET"]>(null);

onMount(clients, () => {
  task(refreshClients);
});

export async function refreshClients() {
  clients.set(await api({ endpoint: "clientAll", method: "GET" }));
}

export default clients;
