import Client, { z, type ORM } from "@/helpers/orm";

export const RespondentResponseSchema = z.object({
  revisionId: z.string(),
  createdBy: z.string(),
  questionId: z.string(),
  respondentId: z.string(),
  freeformResponse: z.string().optional(),
  curratedResponseId: z.string().optional(),
}) satisfies z.Schema<ORM.RespondentResponseUncheckedCreateInput>;

export default new Client().$extends({
  query: {
    respondentResponse: {
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
