import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type respondents = {
  POST: ORM.RespondentGetPayload<{}>;
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  const existing = await orm.respondent.findFirst({
    where: {
      email: data.email,
      surveyId: data.surveyId,
      revisionId: data.revisionId,
    },
  });

  if (data.email && !data.createdBy) data.createdBy = data.email;

  const respondent =
    existing ||
    (await orm.respondent.create({
      data: {
        email: data.email,
        surveyId: data.surveyId,
        createdBy: data.createdBy,
        revisionId: data.revisionId,
      },
    }));

  return new Response(JSON.stringify(respondent), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
