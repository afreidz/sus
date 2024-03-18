import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type surveyId = {
  GET: ORM.SurveyGetPayload<{
    include: { questions: true; scoreType: true; questionOrdering: true };
  }>;
};

export const GET: APIRoute = async ({ params }) => {
  const survey = await orm.survey.findFirst({
    where: { id: params.id },
    include: { questions: true, scoreType: true, questionOrdering: true },
  });

  if (survey && survey.questionOrdering) {
    survey.questions = survey.questionOrdering.order
      .map((id) => {
        return survey.questions.find((q) => q.questionId === id);
      })
      .filter(Boolean) as typeof survey.questions;
  }

  return new Response(JSON.stringify(survey), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
