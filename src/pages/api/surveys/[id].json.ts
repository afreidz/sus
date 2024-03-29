import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";
import { dataURItoBuffer } from "@/helpers/image";

export type surveyId = {
  GET: ORM.SurveyGetPayload<{
    include: { questions: true; scoreType: true; questionOrdering: true };
  }>;
  PUT: ORM.SurveyGetPayload<{}>;
  DELETE: { success: boolean; message?: string };
};

export const GET: APIRoute = async ({ params }) => {
  const survey = await orm.survey.findFirst({
    where: { id: params.id },
    include: { questions: true, scoreType: true, questionOrdering: true },
  });

  if (survey && survey.questionOrdering) {
    survey.questions = survey.questionOrdering.order
      .map((id) => {
        return survey.questions.find((q) => q.id === id);
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

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();

  data.questions.forEach(
    (q: { media: string | Buffer | null }) =>
      (q.media = dataURItoBuffer(q.media as string))
  );

  const newQuestions = data.questions.filter((q: any) => !q.id);
  const existingQuestion = data.questions.filter((q: any) => !!q.id);
  const removedQuestions = data.removedQuestions
    ? [...data.removedQuestions]
    : [];

  delete data.removedQuestions;

  const survey = await orm.survey.update({
    where: { id: params.id },
    data: {
      ...data,
      questions: {
        create: newQuestions,
        connectOrCreate: existingQuestion.map((q: { id: string }) => ({
          where: { id: q.id },
          create: q,
        })),
        disconnect: removedQuestions.map((id: string) => ({ id })),
      },
    },
    include: { questions: { include: { curratedResponses: true } } },
  });

  // await orm.surveyQuestionOrder.upsert({
  //   where: { surveyId: survey.id },
  //   update: {
  //     surveyId: survey.id,
  //     createdBy: survey.createdBy,
  //     order: survey.questions.map((q) => q.id),
  //   },
  //   create: {
  //     surveyId: survey.id,
  //     createdBy: survey.createdBy,
  //     order: survey.questions.map((q) => q.id),
  //   },
  // });

  // await orm.curratedResponseOrder.upsert({
  //   where: { surveyId: survey.id },
  //   update: {
  //     surveyId: survey.id,
  //     createdBy: survey.createdBy,
  //     order: survey.questions[0].curratedResponses.map((q) => q.id),
  //   },
  //   create: {
  //     surveyId: survey.id,
  //     createdBy: survey.createdBy,
  //     order: survey.questions[0].curratedResponses.map((q) => q.id),
  //   },
  // });

  return new Response(JSON.stringify(survey), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const taskType = await orm.scoreType.findFirst({ where: { type: "tasks" } });
  const survey = await orm.survey.findFirst({
    where: { id: params.id },
    include: { questions: true },
  });

  if (survey && taskType && survey.scoreTypeId === taskType.id) {
    await orm.question.deleteMany({
      where: { id: { in: survey.questions.map((q) => q.id) } },
    });

    await orm.survey.delete({ where: { id: survey.id } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } else {
    return new Response(
      JSON.stringify({ success: false, message: "Unable to delete survey" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
