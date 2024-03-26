import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type revisionSurveyType = {
  GET: ORM.RevisionGetPayload<{
    include: {
      system: true;
      surveys: {
        where: {
          scoreTypeId: string;
        };
        include: {
          responseOrdering: true;
          questionOrdering: true;
          questions: {
            include: {
              curratedResponses: true;
            };
          };
        };
      };
    };
  }>;
};

export const GET: APIRoute = async ({ params }) => {
  const revision = await orm.revision.findFirst({
    where: {
      id: params.revision,
    },
    include: {
      system: true,
      surveys: {
        where: {
          scoreTypeId: params.type,
        },
        include: {
          responseOrdering: true,
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
    if (survey.responseOrdering) {
      survey.questions.forEach((question) => {
        if (question.curratedResponses) {
          question.curratedResponses = survey.responseOrdering?.order
            .map((id) => {
              return question.curratedResponses.find((cr) => cr.id === id);
            })
            .filter(Boolean) as typeof question.curratedResponses;
        }
      });
    }
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
