import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";
import { orderByKey } from "@/helpers/order";

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
      survey.questions = orderByKey(
        survey.questionOrdering.order,
        survey.questions,
        "id"
      );
    }
    if (survey.responseOrdering?.order) {
      survey.questions.forEach((question) => {
        if (question.curratedResponses) {
          question.curratedResponses = survey.responseOrdering?.order
            ? orderByKey(
                survey.responseOrdering?.order,
                question.curratedResponses,
                "id"
              )
            : question.curratedResponses;
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
