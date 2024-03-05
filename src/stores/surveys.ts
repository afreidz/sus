import api from "@/helpers/api";
import { writable } from "svelte/store";
import type { APIResponses } from "@/api/types";

const surveys = writable<null | APIResponses["surveyAll"]["GET"]>(null, () => {
  refreshSurveys();
});

export async function refreshSurveys() {
  surveys.set(await api({ endpoint: "surveyAll", method: "GET" }));
}

export default surveys;
