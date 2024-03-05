import api from "@/helpers/api";
import { writable } from "svelte/store";
import type { APIResponses } from "@/api/types";

const clients = writable<null | APIResponses["clientAll"]["GET"]>(null, () => {
  refreshClients();
});

export async function refreshClients() {
  clients.set(await api({ endpoint: "clientAll", method: "GET" }));
}

export default clients;
