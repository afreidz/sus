import orm from "../schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type respondentBySurveyId = {
  GET: ORM.RespondentGetPayload<{
    include: {
      responses: {
        include: { curratedResponse: true; question: true };
      };
    };
  }>;
};

export const GET: APIRoute = async ({ params }) => {
  const questions = params.surveyId
    ? (
        await orm.survey.findFirst({
          where: { id: params.surveyId },
          include: { questions: true },
        })
      )?.questions.map((q) => q.id)
    : undefined;

  const respondent = await orm.respondent.findFirst({
    where: { id: params.id },
    include: {
      responses: {
        include: { curratedResponse: true, question: true },
        where: questions ? { questionId: { in: questions } } : undefined,
      },
    },
  });

  return new Response(JSON.stringify(respondent), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
