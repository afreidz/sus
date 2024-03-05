import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type clientId = {
  GET: Prisma.ClientGetPayload<{ include: { System: true } }>;
  PUT: Prisma.ClientGetPayload<{ include: { System: true } }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const client = await orm.client.findFirst({
    where: { id: params.id },
    include: { System: true },
  });

  return new Response(JSON.stringify(client), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const client = await orm.client.update({
    where: { id: params.id },
    data: (await request.json()) as Prisma.ClientCreateInput,
  });

  return new Response(JSON.stringify(client), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.client.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
