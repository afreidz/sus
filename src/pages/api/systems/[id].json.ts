import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type systemId = {
  GET: ORM.SystemGetPayload<{
    include: {
      client: true;
      revisions: {
        include: {
          system: { include: { client: true } },
          surveys: { include: { respondents: { include: { responses: { include: { curratedResponse: true, question: true} } } }, questions: { include: { curratedResponses: true }} } };
          respondents: {
            include: {
              responses: {
                include: { curratedResponse: true; question: true };
              };
            };
          };
        };
      };
    };
  }>;
  PUT: ORM.SystemGetPayload<{
    include: { client: true; revisions: true };
  }>;
  DELETE: { success: boolean };
};

export const GET: APIRoute = async ({ params }) => {
  const system = await orm.system.findFirst({
    where: { id: params.id },
    include: {
      client: true,
      revisions: {
        orderBy: { createdAt: "asc" },
        include: {
          system: { include: { client: true } },
          surveys: { include: { respondents: { include: { responses: { include: { curratedResponse: true, question: true} } } }, questions: { include: { curratedResponses: true }} } },
          respondents: {
            include: {
              responses: {
                include: { curratedResponse: true, question: true },
              },
            },
          },
        },
      },
    },
  });

  return new Response(JSON.stringify(system), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const system = await orm.system.update({
    where: { id: params.id },
    data: await request.json(),
  });

  return new Response(JSON.stringify(system), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await orm.system.delete({ where: { id: params.id } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
