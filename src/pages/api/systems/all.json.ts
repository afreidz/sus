import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type systemAll = {
  GET: Prisma.SystemGetPayload<{
    include: { client: true; Revision: true };
  }>[];
  POST: Prisma.SystemGetPayload<{
    include: { client: true; Revision: true };
  }>;
};

export const GET: APIRoute = async () => {
  const systems = await orm.system.findMany({
    include: { client: true },
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
