import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";

export const SurveyCreateSchema = z.object({
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  label: z.string().min(3).max(100),
}) satisfies z.Schema<Prisma.SurveyUncheckedCreateInput>;

export default new PrismaClient().$extends({
  query: {
    survey: {
      create({ args, query }) {
        args.data = SurveyCreateSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = SurveyCreateSchema.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = SurveyCreateSchema.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = SurveyCreateSchema.parse(args.create);
        args.update = SurveyCreateSchema.partial().parse(args.update);
        return query(args);
      },
    },
  },
});
