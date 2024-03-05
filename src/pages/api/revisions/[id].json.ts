import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type revisionId = {
  GET: Prisma.RevisionGetPayload<{
    include: { system: true; survey: true };
  }>;
  PUT: Prisma.RevisionGetPayload<{
    include: { system: true; survey: true };
  }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const revision = await orm.revision.findFirst({
    where: { id: params.id },
    include: { system: true, survey: true },
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const revision = await orm.revision.update({
    where: { id: params.id },
    data: await request.json(),
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.revision.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
