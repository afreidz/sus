import Client, { z, type ORM } from "@/helpers/orm";

export const QuestionCreateSchema = z.object({
  text: z.string(),
  surveyId: z.string(),
  createdBy: z.string(),
  revisionId: z.string(),
  responses: z.array(z.string()),
  mediaMIME: z.string().optional(),
  mediaLocation: z.string().optional(),
  media: z.instanceof(Buffer).optional(),
}) satisfies z.Schema<
  ORM.QuestionUncheckedCreateInput & {
    responses: string[];
    surveyId: string;
  }
>;

export default new Client();
