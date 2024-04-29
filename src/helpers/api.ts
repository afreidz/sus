import { refreshMe } from "@/stores/me";
import type { me as Me } from "@/api/me.json";
import type { surveys } from "@/api/surveys/all.json";
import type { clients } from "@/api/clients/all.json";
import type { systems } from "@/api/systems/all.json";
import type { clientId } from "@/api/clients/[id].json";
import type { surveyId } from "@/api/surveys/[id].json";
import type { systemId } from "@/api/systems/[id].json";
import type { types } from "@/api/public/types/all.json";
import type { revisions } from "@/api/revisions/all.json";
import type { type } from "@/api/public/types/[type].json";
import type { transcription } from "@/pages/api/transcribe";
import type { revisionId } from "@/api/revisions/[id].json";
import type { sessions } from "@/pages/api/sessions/all.json";
import type { respondents } from "@/api/respondents/all.json";
import type { response } from "@/api/public/responses/all.json";
import type { surveyType } from "@/api/surveys/type/[type].json";
import type { respondentId } from "@/api/public/respondents/[id].json";
import type { publicRespondentId } from "@/api/public/respondents/[id].json";
import type { respondentBySurveyId } from "@/pages/api/respondents/[surveyId]/[id].json";
import type { nonCurrentSUSRespondents } from "@/pages/api/respondents/noncurrent/all.json";
import type { revisionSurveyType } from "@/api/public/surveys/[revision]/[type]/first.json";
import type { curratedResponsesByType } from "@/pages/api/curratedResponses/[scoreType]/all.json";
import type { respondentResponses } from "@/pages/api/public/responses/revision/[revisionId]/[respondentId].json";
import type { respondentSurveyResponses } from "@/pages/api/public/responses/survey/[surveyId]/[respondentId].json";

export type APIResponses = {
  me: Me;
  types: types;
  typesType: type;
  surveys: surveys;
  systems: systems;
  clients: clients;
  sessions: sessions;
  surveyId: surveyId;
  clientId: clientId;
  systemId: systemId;
  responses: response;
  revisions: revisions;
  surveyType: surveyType;
  revisionId: revisionId;
  respondents: respondents;
  respondentId: respondentId;
  transcription: transcription;
  publicRespondentId: publicRespondentId;
  revisionSurveyType: revisionSurveyType;
  respondentBySurveyId: respondentBySurveyId;
  respondentResponseRevision: respondentResponses;
  curratedResponsesByType: curratedResponsesByType;
  nonCurrentSUSRespondents: nonCurrentSUSRespondents;
  respondentSurveyResponses: respondentSurveyResponses;
};

type Endpoints = keyof typeof endpoints;
type EndpointsWithCustomSubstitutions = keyof CustomSubstitutions;
type EndpointsWithSubstitutions = Extract<
  Endpoints,
  `${string}Id` | `${string}Type`
>;

type Substitutions<E> = E extends undefined
  ? Record<string, string | undefined>
  : E extends EndpointsWithCustomSubstitutions
    ? CustomSubstitutions[E]
    : E extends EndpointsWithSubstitutions
      ? { [k in Extract<EndpointsWithSubstitutions, E>]: string } & Record<
          string,
          string | undefined
        >
      : never;

type SearchParams = Record<string, string | string[] | undefined>;

type CustomSubstitutions = {
  respondentBySurveyId: {
    surveyId?: string;
    respondentId: string;
  };
  revisionSurveyType: {
    revisionId: string;
    typeId: string;
  };
  respondentResponseRevision: {
    revisionId: string;
    respondentId: string;
  };
  curratedResponsesByType: {
    scoreType: string;
  };
  respondentSurveyResponses: {
    surveyId: string;
    respondentId: string;
  };
};

type APIProps<E, M> = {
  method?: M;
  endpoint: E;
  base?: string | URL;
  body?: string | FormData;
  searchParams?: SearchParams;
  substitutions?: Substitutions<E>;
  headers?: RequestInit["headers"];
  signal?: AbortController["signal"];
} & RequestInit;

export const endpoints = {
  me: "/api/me.json",
  clients: "/api/clients/all.json",
  systems: "/api/systems/all.json",
  surveys: "/api/surveys/all.json",
  transcription: "/api/transcribe",
  sessions: "/api/sessions/all.json",
  types: "/api/public/types/all.json",
  revisions: "/api/revisions/all.json",
  respondents: "/api/respondents/all.json",
  clientId: "/api/clients/{clientId}.json",
  systemId: "/api/systems/{systemId}.json",
  surveyId: "/api/surveys/{surveyId}.json",
  responses: "/api/public/responses/all.json",
  revisionId: "/api/revisions/{revisionId}.json",
  typesType: "/api/public/types/{typesType}.json",
  surveyType: "/api/surveys/type/{surveyType}.json",
  respondentId: "/api/public/respondents/{respondentId}.json",
  nonCurrentSUSRespondents: "/api/respondents/noncurrent/all.json",
  curratedResponsesByType: "/api/curratedResponses/{scoreType}/all.json",
  respondentBySurveyId: "/api/respondents/{surveyId}/{respondentId}.json",
  publicRespondentId: "/api/public/respondents/{publicRespondentId}.json",
  revisionSurveyType: "/api/public/surveys/{revisionId}/{typeId}/first.json",
  respondentResponseRevision:
    "/api/public/responses/revision/{revisionId}/{respondentId}.json",
  respondentSurveyResponses:
    "/api/public/responses/survey/{surveyId}/{respondentId}.json",
} as const;

export default async function api<
  E extends Endpoints,
  M extends keyof APIResponses[E],
>({
  body,
  base,
  method,
  headers: h,
  endpoint: e,
  searchParams,
  substitutions,
  ...fetchProps
}: APIProps<E, M>): Promise<APIResponses[E][M]> {
  let endpoint = `${endpoints[e]}`;

  const headers = new Headers(h) ?? new Headers({});
  if (!headers.get("Content-Type") && typeof body === "string")
    headers.set("Content-Type", "application/json");

  Object.entries(substitutions || {}).forEach((sub) => {
    if (typeof sub[1] === "string")
      endpoint = endpoint.replaceAll(`{${sub[0]}}`, sub[1]);
  });

  const url = new URL(endpoint, base || import.meta.env.PUBLIC_API_ORIGIN);

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (key && Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v.toString()));
    } else if (key && typeof value === "string") {
      url.searchParams.set(key, value);
    }
  });

  if (method === "POST" && typeof body === "string") {
    const account = await refreshMe().catch(() => null);
    if (account?.user?.email) {
      const bodyData = JSON.parse(body);
      bodyData.createdBy = account.user.email;
      body = JSON.stringify(bodyData);
    }
  }

  const resp =
    !method || method === "GET"
      ? await fetch(url, {
          ...fetchProps,
          headers,
          method: "GET",
        })
      : await fetch(url, {
          ...fetchProps,
          body,
          method,
          headers,
        });

  if (!resp?.ok) {
    throw new Error("Something went wrong. Please try again.");
  }

  return await resp.json();
}
