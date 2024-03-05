import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type systemId = {
  GET: Prisma.SystemGetPayload<{
    include: { client: true; Revision: true };
  }>;
  PUT: Prisma.SystemGetPayload<{
    include: { client: true; Revision: true };
  }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const system = await orm.system.findFirst({
    where: { id: params.id },
    include: { client: true, Revision: true },
  });

  return new Response(JSON.stringify(system), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const system = await orm.system.update({
    where: { id: params.id },
    data: await request.json(),
  });

  return new Response(JSON.stringify(system), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.system.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
