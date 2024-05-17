import type { APIRoute } from "astro";
import { type ORM } from "@/helpers/orm";
import orm, { SessionSchema } from "./schema";

export type sessionId = {
  GET: ORM.SessionGetPayload<{
    include: {
      clips: true;
      moments: true;
      results: true;
      feedback: true;
      suggestions: true;
      transcripts: true;
      respondent: {
        include: {
          responses: {
            include: {
              question: true;
              curratedResponse: true;
            };
          };
          revision: {
            include: {
              surveys: true;
              system: { include: { client: true } };
            };
          };
        };
      };
    };
  }>;
  PUT: ORM.SessionGetPayload<{
    include: {
      clips: true;
      moments: true;
      results: true;
      feedback: true;
      suggestions: true;
      transcripts: true;
      respondent: {
        include: {
          responses: {
            include: {
              question: true;
              curratedResponse: true;
            };
          };
          revision: {
            include: {
              surveys: true;
              system: { include: { client: true } };
            };
          };
        };
      };
    };
  }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const checklistType = await orm.scoreType.findFirst({
    where: { type: "tasks" },
  });

  if (!checklistType) throw new Error("unable to get responses for session");

  const session = await orm.session.findFirst({
    where: { id: params.id },
    include: {
      clips: true,
      moments: true,
      results: true,
      feedback: true,
      suggestions: true,
      transcripts: true,
      respondent: {
        include: {
          responses: {
            include: { question: true, curratedResponse: true },
          },
          revision: {
            include: { surveys: true, system: { include: { client: true } } },
          },
        },
      },
    },
  });

  return new Response(JSON.stringify(session), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const body = await request.json();

  const { clips, moments, transcript, createdBy } =
    await SessionSchema.parseAsync(body);

  const session = await orm.session.update({
    include: {
      clips: true,
      moments: true,
      transcripts: true,
      respondent: {
        include: {
          revision: {
            include: { surveys: true, system: { include: { client: true } } },
          },
        },
      },
    },
    where: { id: params.id },
    data: {
      transcripts: transcript?.length
        ? {
            createMany: {
              data: transcript.map((segment) => ({
                time: segment.time,
                text: segment.text,
                speaker: segment.speaker,
              })),
            },
          }
        : undefined,
      moments: moments?.length
        ? {
            createMany: {
              data: moments.map((moment) => ({
                createdBy,
                time: moment.time,
                text: moment.text,
              })),
            },
          }
        : undefined,
      clips: clips?.length
        ? {
            createMany: {
              data: clips.map((clip) => ({
                createdBy,
                startTime: clip.start,
                endTime: clip.end,
                videoURL: clip.url,
              })),
            },
          }
        : undefined,
    },
  });

  return new Response(JSON.stringify(session), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.session.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
