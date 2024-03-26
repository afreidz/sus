import orm from "../../schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type respondentResponses = {
  GET: ORM.ResponseGetPayload<{
    include: { curratedResponse: true };
  }>[];
};

export const GET: APIRoute = async ({ params }) => {
  const responses = await orm.response.findMany({
    where: {
      revisionId: params.revisionId,
      respondentId: params.respondentId,
    },
    include: { curratedResponse: true },
  });

  return new Response(JSON.stringify(responses), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
