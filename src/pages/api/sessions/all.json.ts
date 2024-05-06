import type { APIRoute } from "astro";
import { type ORM } from "@/helpers/orm";
import orm, { SessionSchema } from "./schema";

export type sessions = {
  POST: ORM.SessionGetPayload<{
    include: {
      clips: true;
      moments: true;
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
  GET: (ORM.SessionGroupByOutputType & {
    sessions: ORM.SessionGetPayload<{
      include: {
        clips: true;
        moments: true;
        transcripts: true;
      };
    }>[];
    respondent: ORM.RespondentGetPayload<{
      include: {
        revision: {
          include: {
            system: { include: { client: true } };
          };
        };
      };
    }>;
  })[];
};

export const GET: APIRoute = async () => {
  const groups = await orm.session.groupBy({
    by: ["respondentId"],
    _count: true,
  });

  const sessions = await Promise.all(
    groups.map(async (session) => {
      const respondent = await orm.respondent.findUnique({
        where: { id: session.respondentId },
        include: {
          revision: {
            include: { system: { include: { client: true } } },
          },
        },
      });

      const sessions = await orm.session.findMany({
        where: { respondentId: session.respondentId },
        include: {
          clips: true,
          moments: true,
          transcripts: true,
        },
      });

      return { ...session, respondent, sessions };
    })
  );

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
