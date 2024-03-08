import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";
import { susType, refreshTypes } from "@/stores/types";

const surveys = atom<null | APIResponses["surveyType"]["GET"]>(null);

export async function refreshSurveys() {
  await refreshTypes();

  const surveyType = susType.get()?.id;
  if (!surveyType) return surveys.set([]);

  surveys.set(
    await api({
      method: "GET",
      endpoint: "surveyType",
      substitutions: { surveyType },
    })
  );
}

export default surveys;
