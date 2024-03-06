import type { me } from "@/api/me.json";
import type { surveyId } from "@/api/surveys/[id].json";
import type { surveyAll } from "@/api/surveys/all.json";
import type { clientId } from "@/api/clients/[id].json";
import type { clientAll } from "@/api/clients/all.json";
import type { systemAll } from "@/api/systems/all.json";
import type { systemId } from "@/api/systems/[id].json";
import type { revisionAll } from "@/api/revisions/all.json";
import type { revisionId } from "@/api/revisions/[id].json";
import type { respondentAll } from "@/api/respondents/all.json";

export type APIResponses = {
  me: me;
  surveyId: surveyId;
  clientId: clientId;
  systemId: systemId;
  revisionId: revisionId;
  surveyAll: surveyAll;
  clientAll: clientAll;
  systemAll: systemAll;
  revisionAll: revisionAll;
  respondentAll: respondentAll;
};

export { Prisma } from "@prisma/client";
