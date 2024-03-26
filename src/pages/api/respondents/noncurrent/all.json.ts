import orm from "../schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type nonCurrentSUSRespondents = {
  GET: ORM.RespondentGetPayload<{
    include: {
      revision: true;
      responses: { include: { curratedResponse: true; question: true } };
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
      revision: true,
      responses: { include: { curratedResponse: true, question: true } },
    },
  });

  return new Response(JSON.stringify(respondents), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
