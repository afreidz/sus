import { safeTextRegEx } from "@/helpers/strings";
import Client, { z, type ORM } from "@/helpers/orm";

export const SurveyCreateSchema = z.object({
  createdBy: z.string(),
  scoreTypeId: z.string(),
  updatedAt: z.date().optional(),
  revisionId: z.string().optional(),
  label: z.string().min(3).max(100).regex(safeTextRegEx),
}) satisfies z.Schema<ORM.SurveyUncheckedCreateInput>;

export default new Client();
