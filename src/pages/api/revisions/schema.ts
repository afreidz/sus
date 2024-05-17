import { safeTextRegEx } from "@/helpers/strings";
import Client, { z, type ORM } from "@/helpers/orm";

export const RevisionCreateSchema = z.object({
  systemId: z.string(),
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  title: z.string().min(3).max(100).regex(safeTextRegEx),
}) satisfies z.Schema<ORM.RevisionUncheckedCreateInput>;

export const RevisionSummarySchema = z.object({
  summary: z.string(),
  results: z.array(z.string()),
  feedback: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export default new Client().$extends({
  query: {
    revision: {
      create({ args, query }) {
        args.data = RevisionCreateSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = RevisionCreateSchema.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = RevisionCreateSchema.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = RevisionCreateSchema.parse(args.create);
        args.update = RevisionCreateSchema.partial().parse(args.update);
        return query(args);
      },
    },
  },
});
