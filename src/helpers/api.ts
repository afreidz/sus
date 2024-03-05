import { get } from "svelte/store";
import me, { refreshMe } from "@/stores/me";
import type { APIResponses } from "@/api/types";

export const endpoints = {
  me: "/api/me.json",
  clientAll: "/api/clients/all.json",
  clientId: "/api/clients/CLIENT_ID.json",
  systemAll: "/api/systems/all.json",
  systemId: "/api/systems/SYSTEM_ID.json",
  revisionAll: "/api/revisions/all.json",
  revisionId: "/api/revisions/REVISION_ID.json",
  surveyAll: "/api/surveys/all.json",
  surveyId: "/api/survey/SURVEY_ID.json",
};

export type Substitution = Record<string, string | undefined>;
export type SearchParams = Record<string, string | string[] | undefined>;

type Endpoints = keyof typeof endpoints;

export type APIProps<E, M> = {
  method?: M;
  endpoint: E;
  body?: string;
  base?: string | URL;
  searchParams?: SearchParams;
  substitutions?: Substitution;
  signal?: AbortController["signal"];
} & RequestInit;

export default async function api<
  E extends Endpoints,
  M extends keyof APIResponses[E],
>({
  body,
  signal,
  method,
  endpoint: e,
  searchParams,
  substitutions,
  base = window.location.href,
  ...fetchProps
}: APIProps<E, M>): Promise<APIResponses[E][M]> {
  let endpoint = `${endpoints[e]}`;

  const headers = new Headers({
    "Content-Type": "application/json",
    ...fetchProps?.headers,
  });

  if (headers.get("Content-Type") === "") headers.delete("Content-Type");

  Object.entries(substitutions || {}).forEach((sub) => {
    if (typeof sub[1] === "string")
      endpoint = endpoint.replaceAll(sub[0], sub[1]);
  });

  const url = new URL(endpoint, base);

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
