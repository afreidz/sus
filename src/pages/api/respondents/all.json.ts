import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type respondentAll = {
  POST: Prisma.RespondentGetPayload<{}>;
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
