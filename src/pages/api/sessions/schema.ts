import Client, { z } from "@/helpers/orm";
export default new Client();

export const ClipsSchema = z.array(
  z.object({
    id: z.string().optional(),
    end: z.string().datetime(),
    start: z.string().datetime(),
    url: z.string().url().optional(),
  })
);

export const MomentsSchema = z.array(
  z.object({
    id: z.string().optional(),
    time: z.string().datetime(),
    text: z.string().min(2).max(200),
  })
);

export const TranscriptSchema = z.array(
  z.object({
    text: z.string(),
    id: z.string().optional(),
    time: z.string().datetime(),
    speaker: z.enum(["host", "participant"]),
  })
);

export const SessionSchema = z.object({
  createdBy: z.string(),
  respondentId: z.string(),
  id: z.string().optional(),
  clips: ClipsSchema.optional(),
  moments: MomentsSchema.optional(),
  transcript: TranscriptSchema.optional(),
  serverRecordingId: z.string().optional(),
});

export const RecordActionSchema = z
  .object({
    sessionId: z.string(),
    serverCallId: z.string(),
    action: z.literal("start"),
  })
  .or(
    z.object({
      recordingId: z.string(),
      sessionId: z.string().optional(),
      action: z.literal("stop"),
    })
  )
  .or(
    z.object({
      recordingId: z.string(),
      sessionId: z.string().optional(),
      action: z.literal("status"),
    })
  );

export type SessionSchema = z.infer<typeof SessionSchema>;
