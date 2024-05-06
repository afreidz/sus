import orm from "../schema";
import OpenAI from "openai";
import type { APIRoute } from "astro";

export type SummarizeSession = {
  GET: { prompt: string };
};

export const GET: APIRoute = async ({ params }) => {
  const checklistType = await orm.scoreType.findFirst({
    where: { type: "tasks" },
  });

  if (!checklistType)
    throw new Error("unable to get responses for summarization");

  const session = await orm.session.findFirst({
    where: { id: params.id },
    include: {
      moments: true,
      transcripts: true,
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
    },
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
* "job_description" which should be the participant's job description
* "feedback" which should be an array of summarized feedback strings
* "results" which should be an array of highlights from the tasks making sure to summarize them in a human-readable
string
* "suggestions" which should be an array of suggestion strings based on the findings

Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.

Here is the conversation:
${JSON.stringify(conversationForSummarization)}

Here are the task results:
${JSON.stringify(responsesForSummarization)}

Here are the key moments:
${JSON.stringify(momentsForSummarization)}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return new Response(response.choices[0].message.content ?? "{}", {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
