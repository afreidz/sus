import { get } from "svelte/store";
import me, { refreshMe } from "@/stores/me";
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
import type { revisionId } from "@/api/revisions/[id].json";
import type { respondents } from "@/api/respondents/all.json";
import type { surveyType } from "@/api/surveys/type/[type].json";
import type { revisionSurveyType } from "@/api/public/surveys/[revision]/[type]/first.json";

export type APIResponses = {
  me: Me;
  types: types;
  typesType: type;
  surveys: surveys;
  systems: systems;
  clients: clients;
  surveyId: surveyId;
  clientId: clientId;
  systemId: systemId;
  revisions: revisions;
  surveyType: surveyType;
  revisionId: revisionId;
  respondents: respondents;
  revisionSurveyType: revisionSurveyType;
};

type Endpoints = keyof typeof endpoints;

type EndpointsWithCustomSubstitutions = "revisionSurveyType";

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
  revisionSurveyType: {
    revisionId: string;
    typeId: string;
  };
};

type APIProps<E, M> = {
  method?: M;
  endpoint: E;
  body?: string;
  base?: string | URL;
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
  types: "/api/public/types/all.json",
  revisions: "/api/revisions/all.json",
  clientId: "/api/clients/{clientId}.json",
  systemId: "/api/systems/{systemId}.json",
  surveyId: "/api/surveys/{surveyId}.json",
  respondents: "/api/respondents/all.json",
  revisionId: "/api/revisions/{revisionId}.json",
  typesType: "/api/public/types/{typesType}.json",
  surveyType: "/api/surveys/type/{surveyType}.json",
  revisionSurveyType: "/api/public/surveys/{revisionId}/{typeId}/first.json",
} as const;

export default async function api<
  E extends Endpoints,
  M extends keyof APIResponses[E],
>({
  body,
  base,
  signal,
  method,
  headers: h,
  endpoint: e,
  searchParams,
  substitutions,
  ...fetchProps
}: APIProps<E, M>): Promise<APIResponses[E][M]> {
  let endpoint = `${endpoints[e]}`;

  const headers = new Headers(h) ?? new Headers({});
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

  if (method === "POST" && body) {
    await refreshMe();
    if (!get(me)?.user?.email)
      throw new Error("unable to determine who is creating this record");
    const bodyData = JSON.parse(body);
    bodyData.createdBy = get(me)?.user?.email;
    body = JSON.stringify(bodyData);
  }

  const resp = await fetch(url, {
    ...fetchProps,
    method,
    signal,
    headers,
    body,
  }).catch(() => null);

  if (!resp?.ok) {
    throw new Error("Something went wrong. Please try again.");
  }

  return await resp.json();
}
