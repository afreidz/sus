import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type revisionId = {
  GET: ORM.RevisionGetPayload<{
    include: {
      system: { include: { client: true } };
      respondents: {
        include: {
          responses: { include: { curratedResponse: true; question: true } };
        };
      };
      surveys: {
        include: {
          questionOrdering: true;
          questions: { include: { curratedResponses: true } };
        };
      };
    };
  }>;
  PUT: ORM.RevisionGetPayload<{
    include: {
      system: true;
      surveys: true;
      respondents: { include: { responses: true } };
    };
  }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const revision = await orm.revision.findFirst({
    where: { id: params.id },
    include: {
      system: { include: { client: true } },
      respondents: {
        include: {
          responses: { include: { curratedResponse: true, question: true } },
        },
      },
      surveys: {
        include: {
          questionOrdering: true,
          questions: { include: { curratedResponses: true } },
        },
      },
    },
  });

  revision?.surveys.forEach((survey) => {
    if (survey && survey.questionOrdering) {
      survey.questions = survey.questionOrdering.order
        .map((id) => {
          return survey.questions.find((q) => q.id === id);
        })
        .filter(Boolean) as typeof survey.questions;
    }
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const revision = await orm.revision.update({
    where: { id: params.id },
    data: await request.json(),
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.revision.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
