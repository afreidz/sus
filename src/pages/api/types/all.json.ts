import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type types = {
  GET: ORM.ScoreTypeGetPayload<{}>[];
};

export const GET: APIRoute = async () => {
  const types = await orm.scoreType.findMany();

  return new Response(JSON.stringify(types), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
