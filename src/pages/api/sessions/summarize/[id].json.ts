import OpenAI from "openai";
import type { APIRoute } from "astro";
import { type ORM } from "@/helpers/orm";
import orm, { SummarySchema } from "../schema";

export type SummarizeSession = {
  GET: ORM.SessionGetPayload<{
    include: {
      moments: true;
      results: true;
      feedback: true;
      suggestions: true;
      transcripts: true;
      respondent: {
        include: {
          revision: {
            include: {
              system: {
                include: { client: true };
              };
            };
          };
          responses: {
            include: {
              question: true;
              curratedResponse: true;
            };
          };
        };
      };
    };
  }>;
};

export const GET: APIRoute = async ({ params }) => {
  const checklistType = await orm.scoreType.findFirst({
    where: { type: "tasks" },
  });

  if (!checklistType)
    throw new Error("unable to get responses for summarization");

  const includesForSummary = {
    moments: true,
    transcripts: true,
    suggestions: true,
    results: true,
    feedback: true,
    respondent: {
      include: {
        responses: {
          where: {
            survey: {
              scoreTypeId: checklistType.id,
            },
          },
          include: {
            question: true,
            curratedResponse: true,
          },
        },
        revision: {
          include: { system: { include: { client: true } } },
        },
      },
    },
  };

  const includesForReturn = {
    moments: true,
    transcripts: true,
    suggestions: true,
    results: true,
    feedback: true,
    respondent: {
      include: {
        responses: {
          include: {
            question: true,
            curratedResponse: true,
          },
        },
        revision: {
          include: { system: { include: { client: true } } },
        },
      },
    },
  };

  const session = await orm.session.findFirst({
    where: { id: params.id },
    include: includesForSummary,
  });

  if (!session) throw new Error("unable to locate session");

  const openai = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY });

  const conversationForSummarization = session.transcripts.map((t) => ({
    text: t.text,
    time: t.time,
    speaker: t.speaker,
  }));

  const momentsForSummarization = session.moments.map((m) => ({
    time: m.time,
    text: m.text,
  }));

  const responsesForSummarization = session.respondent.responses
    .map((response) => {
      return response.curratedResponseId
        ? {
            task: response.question.text,
            result: response.curratedResponse?.label,
          }
        : undefined;
    })
    .filter(Boolean);

  const prompt = `You are about to receive a conversation in JSON format between a moderator and a participant of a user test. The
conversation is a user test of ${session.respondent.revision.system.title} - ${session.respondent.revision.title}. You will also receive a list of tasks the participant was asked to perform during the conversation and the result of their performance for each task (either pass, delayed, prompted, or failed). You will also be given a list of key moments that were logged during the conversation. Your job is to summarize the conversation focusing on the following:

* identify the participant's name, title, and job description if possible
* determine pain-points based on failed tasks and conversation feedback
* determine well-performing aspects of the prototype based on conversation feedback and successful tasks
* make suggestions based on conversation feedback or unsuccessful tasks

The summary should be short and suitable for a power point slide. Also, return the summary in JSON format with the following properties:

* "name" which should be the participant's name
* "title" which should be the participant's title
* "profile" which should be the participant's job description
* "feedback" which should be an array of summarized feedback strings, limited to 3.
* "results" which should be an array of highlights from the tasks making sure to summarize them in a human-readable
strings, focus on tasks which were not passed, and limit to 3.
* "suggestions" which should be an array of suggestion strings based on the findings, limited to 3.

Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation. If there is not enough information to complete the task, respond with null values or empty arrays for any fields that cannot be determined from the inputs.

Here is the conversation:
${JSON.stringify(conversationForSummarization)}

Here are the task results:
${JSON.stringify(responsesForSummarization)}

Here are the key moments:
${JSON.stringify(momentsForSummarization)}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  const data = JSON.parse(
    response.choices[0].message.content
      ?.replaceAll("```json", "")
      .replaceAll("```", "") ?? "{}"
  );
  const validationResults = SummarySchema.parse(data);

  await orm.respondent.update({
    where: { id: session.respondentId },
    data: {
      name: validationResults.name,
      title: validationResults.title,
      profile: validationResults.profile,
    },
  });

  if (validationResults.feedback.length) {
    await orm.summarizedFeedbackItem.deleteMany({
      where: { sessionId: session.id },
    });

    await orm.summarizedFeedbackItem.createMany({
      data: validationResults.feedback.map((text) => ({
        createdBy: session.createdBy,
        sessionId: session.id,
        text,
      })),
    });
  }

  if (validationResults.results) {
    await orm.summarizedChecklistResult.deleteMany({
      where: { sessionId: session.id },
    });

    await orm.summarizedChecklistResult.createMany({
      data: validationResults.results.map((text) => ({
        createdBy: session.createdBy,
        sessionId: session.id,
        text,
      })),
    });
  }

  if (validationResults.suggestions) {
    await orm.summarizedSuggestion.deleteMany({
      where: { sessionId: session.id },
    });

    await orm.summarizedSuggestion.createMany({
      data: validationResults.suggestions.map((text) => ({
        createdBy: session.createdBy,
        sessionId: session.id,
        text,
      })),
    });
  }

  if (
    validationResults.feedback.length &&
    validationResults.results.length &&
    validationResults.suggestions.length
  ) {
    await orm.session.update({
      where: { id: session.id },
      data: { summarized: true },
    });
  }

  return new Response(
    JSON.stringify(
      await orm.session.findFirst({
        where: { id: session.id },
        include: includesForReturn,
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

// [
//   {
//     name: "summarize_session",
//     description: "Summarize the user test session based on the inputs",
//     parameters: {
//       type: "object",
//       properties: {
//         name: {
//           type: "string",
//           description: "The name of the participant if found",
//         },
//         title: {
//           type: "string",
//           description: "The job title of the participant if found",
//         },
//         job_description: {
//           type: "string",
//           description: "The job description of the participant if found",
//         },
//         feedback: {
//           type: "array",
//           description: "An array of summarized feedback strings",
//         },
//         results: {
//           type: "array",
//           description:
//             "An array of highlights from the tasks summarized in human-readable strings",
//         },
//         suggestions: {
//           type: "array",
//           description: "An array of suggestion strings based on the findings",
//         },
//       },
//     },
//   },
// ];
