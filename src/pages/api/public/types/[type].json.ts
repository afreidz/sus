import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type type = {
  GET: ORM.ScoreTypeGetPayload<{}>;
};

export const GET: APIRoute = async ({ params }) => {
  const type = await orm.scoreType.findFirst({
    where: { type: params.type },
  });

  return new Response(JSON.stringify(type), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
