import api from "@/helpers/api";
import type { APIResponses } from "@/api/types";
import { task, onMount, atom } from "nanostores";

const surveys = atom<null | APIResponses["surveyAll"]["GET"]>(null);

onMount(surveys, () => {
  task(refreshSurveys);
});

export async function refreshSurveys() {
  surveys.set(await api({ endpoint: "surveyAll", method: "GET" }));
}

export default surveys;
