import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";

export const RevisionCreateSchema = z.object({
  surveyId: z.string(),
  systemId: z.string(),
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  title: z.string().min(3).max(100),
}) satisfies z.Schema<Prisma.RevisionUncheckedCreateInput>;

export default new PrismaClient().$extends({
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
