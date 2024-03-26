import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type response = {
  POST: ORM.ResponseGetPayload<{}>;
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  if (data.email && !data.createdBy) data.createdBy = data.email;

  const existing = await orm.response.findFirst({
    where: {
      questionId: data.questionId,
      revisionId: data.revisionId,
      respondentId: data.respondentId,
    },
  });

  const response = existing
    ? await orm.response.update({ where: { id: existing.id }, data })
    : await orm.response.create({ data });

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
