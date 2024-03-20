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
              responseOrdering: true;
              questionOrdering: true;
              questions: {
                include: {
                  question: {
                    include: {
                      curratedQuestionResponses: {
                        include: { response: true };
                      };
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
              responseOrdering: true,
              questionOrdering: true,
              questions: {
                include: {
                  question: {
                    include: {
                      curratedQuestionResponses: {
                        include: { response: true },
                      },
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

  revision?.surveys.forEach((revisionSurvey) => {
    const survey = revisionSurvey.survey;
    if (survey && survey.questionOrdering) {
      survey.questions = survey.questionOrdering.order
        .map((id) => {
          return survey.questions.find((q) => q.questionId === id);
        })
        .filter(Boolean) as typeof survey.questions;
    }
    if (survey.responseOrdering) {
      survey.questions.forEach((sq) => {
        if (sq.question.curratedQuestionResponses) {
          sq.question.curratedQuestionResponses = survey.responseOrdering?.order
            .map((id) => {
              return sq.question.curratedQuestionResponses.find(
                (cr) => cr.responseId === id
              );
            })
            .filter(Boolean) as typeof sq.question.curratedQuestionResponses;
        }
      });
    }
  });

  return new Response(JSON.stringify(revision), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
