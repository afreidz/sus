import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type clientId = {
  GET: ORM.ClientGetPayload<{ include: { systems: { include: { client: true, revisions: { include: { surveys: true, respondents: true }, } } } } }>;
  PUT: ORM.ClientGetPayload<{ include: { systems: true } }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const client = await orm.client.findFirst({
    where: { id: params.id },
    include: { systems: { include: { client: true, revisions: { include: { surveys: true, respondents: true } } } } },
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
    data: (await request.json()) as ORM.ClientCreateInput,
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
