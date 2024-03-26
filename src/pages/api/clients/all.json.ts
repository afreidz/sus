import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type clients = {
  GET: ORM.ClientGetPayload<{
    include: {
      systems: { include: { revisions: { include: { respondents: true } } } };
    };
  }>[];
  POST: ORM.ClientGetPayload<{ include: { systems: true } }>;
};

export const GET: APIRoute = async () => {
  const clients = await orm.client.findMany({
    include: {
      systems: { include: { revisions: { include: { respondents: true } } } },
    },
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
