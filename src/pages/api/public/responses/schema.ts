import Client, { z, type ORM } from "@/helpers/orm";

export const RespondentResponseSchema = z.object({
  surveyId: z.string(),
  createdBy: z.string(),
  revisionId: z.string(),
  questionId: z.string(),
  respondentId: z.string(),
  curratedResponseId: z.string().optional(),
  freeformResponse: z.string().min(3).max(1000).optional(),
}) satisfies z.Schema<ORM.ResponseUncheckedCreateInput>;

export default new Client().$extends({
  query: {
    response: {
      create({ args, query }) {
        args.data = RespondentResponseSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = RespondentResponseSchema.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = RespondentResponseSchema.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = RespondentResponseSchema.parse(args.create);
        args.update = RespondentResponseSchema.partial().parse(args.update);
        return query(args);
      },
    },
  },
});
