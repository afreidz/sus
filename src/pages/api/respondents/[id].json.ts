import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type respondentId = {
  GET: ORM.RespondentGetPayload<{ include: { responses: true } }>;
  PUT: ORM.RespondentGetPayload<{}>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const respondent = await orm.respondent.findFirst({
    where: { id: params.id },
    include: { responses: true },
  });

  return new Response(JSON.stringify(respondent), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const respondent = await orm.respondent.update({
    where: { id: params.id },
    data: await request.json(),
  });

  return new Response(JSON.stringify(respondent), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.respondent.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
