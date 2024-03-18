import orm from "./schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type revisionSurveyType = {
  GET: ORM.RevisionGetPayload<{
    include: {
      system: true;
      surveys: {
        where: {
          survey: {
            scoreTypeId: string;
          };
        };
        include: {
          survey: {
            include: {
              questions: {
                include: {
                  question: {
                    include: {
                      curratedQuestionResponse: { include: { response: true } };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  }>;
};

export const GET: APIRoute = async ({ params }) => {
  const revision = await orm.revision.findFirst({
    where: {
      id: params.revision,
    },
    include: {
      system: true,
      surveys: {
        where: {
          survey: {
            scoreTypeId: params.type,
          },
        },
        include: {
          survey: {
            include: {
              questions: {
                include: {
                  question: {
                    include: {
                      curratedQuestionResponse: { include: { response: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
