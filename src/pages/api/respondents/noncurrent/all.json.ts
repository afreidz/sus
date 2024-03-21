import orm from "../schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type nonCurrentSUSRespondents = {
  GET: ORM.RespondentGetPayload<{
    include: {
      survey: true;
      revision: true;
      responses: {
        include: {
          question: { include: { curratedQuestionResponses: true } };
          curratedResponse: true;
        };
      };
    };
  }>[];
};

export const GET: APIRoute = async () => {
  const respondents = await orm.respondent.findMany({
    where: {
      complete: true,
      survey: {
        AND: [
          { scoreType: { type: { contains: "sus" } } },
          { NOT: { label: { contains: "current " } } },
          { NOT: { label: { contains: "Current" } } },
        ],
      },
    },
    include: {
      survey: true,
      revision: true,
      responses: {
        include: {
          question: { include: { curratedQuestionResponses: true } },
          curratedResponse: true,
        },
      },
    },
  });

  return new Response(JSON.stringify(respondents), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
