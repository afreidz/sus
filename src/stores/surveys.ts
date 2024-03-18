import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";

const surveys = atom<null | APIResponses["surveys"]["GET"]>(null);

export async function refreshSurveys() {
  surveys.set(
    await api({
      method: "GET",
      endpoint: "surveys",
    })
  );
}

export default surveys;
