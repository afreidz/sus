import orm from "./schema";
import type { APIRoute } from "astro";
import { z, type ORM } from "@/helpers/orm";
import { uploadToContainer } from "@/helpers/blob";

export type sessions = {
  POST: ORM.SessionSegmentGetPayload<{}>;
};

export const POST: APIRoute = async ({ request }) => {
  const id = `session-${+new Date()}`;
  const data = await request.formData();
  const video = data.get("video") as File;
  const moderator = data.get("moderator") as string;
  const revisionId = data.get("revisionId") as string;
  const respondentId = data.get("respondentId") as string;

  const moments = data
    .getAll("moments")
    .map((m) => JSON.parse(m as any)) as Moments;
  const responses = data
    .getAll("responses")
    .map((r) => JSON.parse(r as any)) as Responses;
  const transcription = data
    .getAll("transcript")
    .map((t) => JSON.parse(t as any)) as Transcription;

  if (!moderator) throw new Error("moderator missing");
  if (!revisionId) throw new Error("revision misssing");
  if (!respondentId) throw new Error("respondent missing");

  const transcriptionSchema = z.array(
    z.object({
      text: z.string(),
      timestamp: z.string().datetime(),
      speaker: z.enum(["host", "participant"]),
    })
  );
  type Transcription = z.infer<typeof transcriptionSchema>;

  const responseSchema = z.array(
    z.object({
      notes: z.string(),
      section: z.string(),
      questionId: z.string(),
      responseId: z.string(),
    })
  );
  type Responses = z.infer<typeof responseSchema>;

  const momentSchema = z.array(
    z.object({
      time: z.string().datetime(),
      note: z.string(),
    })
  );
  type Moments = z.infer<typeof momentSchema>;

  const momentsValid = momentSchema.safeParse(moments);
  const responsesValid = responseSchema.safeParse(responses);
  const transcriptValid = transcriptionSchema.safeParse(transcription);

  if (
    !momentsValid.success ||
    !responsesValid.success ||
    !transcriptValid.success
  )
    throw new Error("Data cannot be validated");

  const videoURL = await uploadToContainer(`${id}-videos`, video);

  const upsertedQuery = {
    id,
    videoURL,
    moderator,
    respondentId,
    group: responses[0].section,
    createdBy: moderator,
    moments: {
      createMany: {
        data: moments.map((m) => ({
          time: m.time,
          text: m.note,
          createdBy: moderator,
        })),
      },
    },
    transcripts: {
      createMany: {
        data: transcription.map((t) => ({
          text: t.text,
          time: t.timestamp,
          speaker: t.speaker,
        })),
      },
    },
    responses: {
      connectOrCreate: responses.map((r) => ({
        where: {
          respondentId_revisionId_questionId: {
            respondentId,
            revisionId,
            questionId: r.questionId,
          },
        },
        create: {
          revisionId,
          respondentId,
          createdBy: moderator,
          questionId: r.questionId,
          freeformResponse: r.notes,
          curratedResponseId: r.responseId,
        },
      })),
    },
  };

  const resp = await orm.sessionSegment.upsert({
    where: {
      respondentId_group: {
        respondentId,
        group: responses[0].section,
      },
    },
    update: upsertedQuery,
    create: upsertedQuery,
  });

  return new Response(JSON.stringify({ success: true, response: resp }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
