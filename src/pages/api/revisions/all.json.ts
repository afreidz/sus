import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type revisions = {
  GET: ORM.RevisionGetPayload<{
    include: {
      system: true;
      surveys: {
        include: {
          survey: { include: { questions: { include: { question: true } } } };
        };
      };
      respondents: { include: { responses: true } };
    };
  }>[];
  POST: ORM.RevisionGetPayload<{
    include: { system: true; surveys: true };
  }>;
};

export const GET: APIRoute = async () => {
  const revisions = await orm.revision.findMany({
    include: {
      system: true,
      surveys: {
        include: {
          survey: { include: { questions: { include: { question: true } } } },
        },
      },
      respondents: { include: { responses: true } },
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

  const revision = await orm.revision.create({
    data: {
      title: data.title,
      systemId: data.systemId,
      createdBy: data.createdBy,
    },
  });

  if (data.surveys.length) {
    await orm.revisionSurvey.createMany({
      data: data.surveys.map((id: string) => ({
        surveyId: id,
        revisionId: revision.id,
        assignedBy: data.createdBy,
      })),
    });
  }

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
