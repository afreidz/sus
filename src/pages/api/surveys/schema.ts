import Client, { z, type ORM } from "@/helpers/orm";

export const SurveyCreateSchema = z.object({
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  label: z.string().min(3).max(100),
}) satisfies z.Schema<ORM.SurveyUncheckedCreateInput>;

export default new Client().$extends({
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
