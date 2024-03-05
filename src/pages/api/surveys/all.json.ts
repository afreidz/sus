import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type surveyAll = {
  GET: Prisma.SurveyGetPayload<{ include: { questions: true } }>[];
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
