import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type revisions = {
  GET: ORM.RevisionGetPayload<{
    include: {
      system: true;
      respondents: { include: { responses: true } };
      surveys: { include: { questions: true } };
    };
  }>[];
  POST: ORM.RevisionGetPayload<{
    include: { system: true; surveys: true };
  }>;
};

export const GET: APIRoute = async () => {
  const revisions = await orm.revision.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      system: true,
      respondents: { include: { responses: true } },
      surveys: {
        include: { questions: true },
      },
    },
  });

  return new Response(JSON.stringify(revisions), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  const surveys = await orm.survey.findMany({
    where: { id: { in: data.surveys } },
  });

  const revision = await orm.revision.create({
    data: {
      title: data.title,
      systemId: data.systemId,
      createdBy: data.createdBy,
    },
  });

  if (surveys && revision.id) {
    await Promise.all(
      surveys.map((survey) => {
        return orm.survey.update({
          where: { id: survey.id },
          data: {
            revisions: {
              connect: { id: revision.id },
            },
          },
        });
      })
    );
  }

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
