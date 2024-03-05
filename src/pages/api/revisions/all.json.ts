import orm from "./schema";
import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";

export type revisionAll = {
  GET: Prisma.RevisionGetPayload<{
    include: { system: true; survey: true };
  }>[];
  POST: Prisma.RevisionGetPayload<{
    include: { system: true; survey: true };
  }>;
};

export const GET: APIRoute = async () => {
  const revisions = await orm.revision.findMany({
    include: { system: true, survey: true },
  });

  return new Response(JSON.stringify(revisions), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const revision = await orm.revision.create({ data: await request.json() });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
