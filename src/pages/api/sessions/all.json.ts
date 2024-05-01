import type { APIRoute } from "astro";
import { type ORM } from "@/helpers/orm";
import orm, { SessionSchema } from "./schema";

export type sessions = {
  POST: ORM.SessionGetPayload<{
    include: {
      clips: true;
      moments: true;
      summary: true;
      transcripts: true;
      respondent: {
        include: {
          revision: {
            include: {
              system: { include: { client: true } };
            };
          };
        };
      };
    };
  }>;
  GET: ORM.SessionGetPayload<{
    include: {
      respondent: {
        include: {
          revision: {
            include: {
              system: { include: { client: true } };
            };
          };
        };
      };
    };
  }>[];
};

export const GET: APIRoute = async () => {
  const sessions = await orm.session.findMany({
    include: {
      respondent: {
        include: {
          revision: {
            include: { system: { include: { client: true } } },
          },
        },
      },
    },
  });

  return new Response(JSON.stringify(sessions), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const validation = await SessionSchema.safeParseAsync(body);

  if (!validation.success) throw validation.error;

  const { createdBy, respondentId, id } = validation.data;

  const session = await orm.session.create({
    include: {
      clips: true,
      moments: true,
      summary: true,
      transcripts: true,
      respondent: {
        include: {
          revision: {
            include: {
              system: { include: { client: true } },
            },
          },
        },
      },
    },
    data: {
      id,
      createdBy: createdBy,
      respondent: {
        connect: {
          id: respondentId,
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
