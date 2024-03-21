import orm from "../schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type curratedResponsesByType = {
  GET: ORM.CurratedResponseGetPayload<{}>[];
};

export const GET: APIRoute = async ({ params }) => {
  const responses = await orm.curratedResponse.findMany({
    where: {
      scoreTypeId: params.scoreType,
    },
  });

  return new Response(JSON.stringify(responses), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
