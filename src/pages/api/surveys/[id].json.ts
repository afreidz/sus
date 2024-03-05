import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type surveyId = {
  GET: Prisma.SurveyGetPayload<{ include: { questions: true } }>;
};

export const GET: APIRoute = async ({ params }) => {
  const survey = await orm.survey.findFirst({
    where: { id: params.id },
    include: { questions: true },
  });

  return new Response(JSON.stringify(survey), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
