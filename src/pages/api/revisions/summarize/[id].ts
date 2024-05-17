import OpenAI from "openai";
import type { APIRoute } from "astro";
import { type ORM } from "@/helpers/orm";
import orm, { RevisionSummarySchema } from "../schema";
import { GET as SummarizeSession } from "@/pages/api/sessions/summarize/[id].json";

export type summarizeRevision = {
  GET: ORM.RevisionGetPayload<{
    include: {
      surveys: true;
      system: {
        include: { client: true };
      };
      suggestions: true;
      feedback: true;
      results: true;
      summary: true;
      respondents: {
        include: {
          responses: {
            include: {
              question: true;
              curratedResponse: true;
            };
          };
          sessions: {
            include: {
              respondent: {
                include: {
                  revision: {
                    include: {
                      surveys: true;
                      system: {
                        include: {
                          client: true;
                        };
                      };
                    };
                  };
                  responses: {
                    include: {
                      survey: true;
                      question: true;
                      curratedResponse: true;
                    };
                  };
                };
              };
              responses: {
                include: {
                  question: true;
                  curratedResponse: true;
                };
              };
              moments: true;
              results: true;
              feedback: true;
              suggestions: true;
              transcripts: true;
            };
          };
        };
      };
    };
  }>;
};

export const GET: APIRoute = async (context) => {
  const checklistType = await orm.scoreType.findFirst({
    where: { type: "tasks" },
  });

  if (!checklistType)
    throw new Error("unable to get responses for summarization");

  const revision = await orm.revision.findFirst({
    where: { id: context.params.id },
    include: {
      system: true,
      respondents: {
        include: {
          responses: {
            where: {
              survey: {
                scoreTypeId: checklistType.id,
              },
            },
            include: {
              curratedResponse: true,
              question: true,
            },
          },
          sessions: {
            include: {
              suggestions: true,
              feedback: true,
              results: true,
              transcripts: true,
              moments: true,
            },
          },
        },
      },
    },
  });

  const includeForReturn = {
    surveys: true,
    system: {
      include: { client: true },
    },
    suggestions: true,
    feedback: true,
    results: true,
    summary: true,
    respondents: {
      include: {
        responses: {
          include: {
            question: true,
            curratedResponse: true,
          },
        },
        sessions: {
          include: {
            respondent: {
              include: {
                revision: {
                  include: {
                    surveys: true,
                    system: {
                      include: {
                        client: true,
                      },
                    },
                  },
                },
                responses: {
                  include: {
                    survey: true,
                    question: true,
                    curratedResponse: true,
                  },
                },
              },
            },
            responses: {
              include: {
                question: true,
                curratedResponse: true,
              },
            },
            moments: true,
            results: true,
            feedback: true,
            suggestions: true,
            transcripts: true,
          },
        },
      },
    },
  };

  if (!revision) throw new Error("unable to locate revision");

  if (revision.summarized) {
    return new Response(
      JSON.stringify(
        await orm.revision.findFirst({
          where: { id: revision.id },
          include: includeForReturn,
        })
      )
    );
  }

  const openai = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY });

  const systemSetup = `You are about to receive data from a series of user tests for an application called ${revision.system.title} in JSON format. Your job is to aggregate the summaries focusing on the following:

* determine common pain-points based on failed tasks and feedback
* determine common well-performing aspects of the prototype based on feedback and tasks
* make suggestions based on feedback and tasks
* provide a general summarization of the postive and negative aspects of the prototype

The summary should be short and suitable for a power point slide. Also, return the summary in json format with the
following properties:

* "feedback" which should be an array of summarized feedback strings limited to 3 entries.
* "results" which should be an array of highlights from the tasks focusing on summarizing which tasks were troublesome to the participants. Limit entries to 3.
* "suggestions" which should be an array of suggestion strings based on the findings limted to 3 entries.
* "summary" which should be the general summarization string`;

  const inputData = {
    conversations: {} as { [key: string]: unknown },
    results: {} as { [key: string]: unknown },
    moments: {} as { [key: string]: unknown },
  };

  await Promise.all(
    revision.respondents.map(async (respondent) => {
      let session =
        respondent.sessions.find((s) => s.summarized) || respondent.sessions[0];

      if (!session) return;

      if (!session.summarized) {
        const resp = await SummarizeSession({
          ...context,
          params: { id: session.id },
        });
        session = await resp.json();
      }

      const key = respondent.name ?? respondent.email;

      inputData.conversations[key] = session.transcripts.map((t) => ({
        text: t.text,
        time: t.time,
        speaker: t.speaker,
      }));

      inputData.results[key] = respondent.responses.map((r) => ({
        task: r.question.text,
        result: r.curratedResponse?.label,
      }));

      inputData.moments[key] = session.moments.map((m) => ({
        time: m.time,
        text: m.text,
      }));
    })
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemSetup },
      { role: "user", content: JSON.stringify(inputData) },
    ],
  });

  const data = JSON.parse(response.choices[0].message.content ?? "");

  // console.log(data);

  const validationResults = RevisionSummarySchema.parse(data);

  if (validationResults.feedback) {
    await orm.summarizedFeedbackItem.deleteMany({
      where: { revisionId: revision.id },
    });

    await orm.summarizedFeedbackItem.createMany({
      data: validationResults.feedback.map((text) => ({
        createdBy: revision.createdBy,
        revisionId: revision.id,
        text,
      })),
    });
  }

  if (validationResults.results) {
    await orm.summarizedChecklistResult.deleteMany({
      where: { revisionId: revision.id },
    });

    await orm.summarizedChecklistResult.createMany({
      data: validationResults.results.map((text) => ({
        createdBy: revision.createdBy,
        revisionId: revision.id,
        text,
      })),
    });
  }

  if (validationResults.suggestions) {
    await orm.summarizedSuggestion.deleteMany({
      where: { revisionId: revision.id },
    });

    await orm.summarizedSuggestion.createMany({
      data: validationResults.suggestions.map((text) => ({
        createdBy: revision.createdBy,
        revisionId: revision.id,
        text,
      })),
    });
  }

  if (validationResults.summary) {
    await orm.summary.deleteMany({
      where: { revisionId: revision.id },
    });

    await orm.summary.create({
      data: {
        revisionId: revision.id,
        createdBy: revision.createdBy,
        text: validationResults.summary,
      },
    });
  }

  if (
    validationResults.feedback.length &&
    validationResults.results.length &&
    validationResults.suggestions.length
  ) {
    await orm.revision.update({
      where: { id: revision.id },
      data: { summarized: true },
    });
  }

  return new Response(
    JSON.stringify(
      await orm.revision.findFirst({
        where: { id: revision.id },
        include: includeForReturn,
      })
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
