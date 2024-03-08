import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type revisions = {
  GET: ORM.RevisionGetPayload<{
    include: { system: true; surveys: true; respondents: true };
  }>[];
  POST: ORM.RevisionGetPayload<{
    include: { system: true; surveys: true };
  }>;
};

export const GET: APIRoute = async () => {
  const revisions = await orm.revision.findMany({
    include: { system: true, surveys: true, respondents: true },
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
