import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type clientAll = {
  GET: Prisma.ClientGetPayload<{ include: { System: true } }>[];
  POST: Prisma.ClientGetPayload<{ include: { System: true } }>;
};

export const GET: APIRoute = async () => {
  const clients = await orm.client.findMany({
    include: { System: true },
  });

  return new Response(JSON.stringify(clients), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const client = await orm.client.create({ data: await request.json() });

  return new Response(JSON.stringify(client), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
