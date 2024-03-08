import api from "@/helpers/api";
import { atom } from "nanostores";
import type { APIResponses } from "@/helpers/api";

const surveys = atom<null | APIResponses["surveyType"]["GET"]>(null);

export async function refreshSurveys() {
  const types = await api({ endpoint: "types", method: "GET" });
  const surveyType = types.find((t) => t.type === "sus")?.id;

  if (!surveyType) return surveys.set([]);
  surveys.set(
    await api({
      endpoint: "surveyType",
      method: "GET",
      substitutions: { surveyType },
    })
  );
}

export default surveys;
