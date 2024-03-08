import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type respondents = {
  POST: ORM.RespondentGetPayload<{}>;
};

export const POST: APIRoute = async ({ request }) => {
  const respondent = await orm.respondent.create({
    data: await request.json(),
  });

  return new Response(JSON.stringify(respondent), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
