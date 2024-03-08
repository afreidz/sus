import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type systems = {
  GET: ORM.SystemGetPayload<{
    include: { client: true; revisions: true };
  }>[];
  POST: ORM.SystemGetPayload<{
    include: { client: true; revisions: true };
  }>;
};

export const GET: APIRoute = async () => {
  const systems = await orm.system.findMany({
    include: { client: true, revisions: true },
  });

  return new Response(JSON.stringify(systems), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const system = await orm.system.create({ data: await request.json() });

  return new Response(JSON.stringify(system), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
