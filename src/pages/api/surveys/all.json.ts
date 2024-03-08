import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type surveys = {
  GET: ORM.SurveyGetPayload<{ include: { questions: true } }>[];
};

export const GET: APIRoute = async () => {
  const surveys = await orm.survey.findMany({
    include: { questions: true },
  });

  return new Response(JSON.stringify(surveys), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
