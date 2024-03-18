import Client, { z, type ORM } from "@/helpers/orm";

export const RespondentCreateSchema = z.object({
  surveyId: z.string(),
  createdBy: z.string(),
  revisionId: z.string(),
  email: z.string().email(),
  complete: z.boolean().optional(),
}) satisfies z.Schema<ORM.RespondentUncheckedCreateInput>;

export default new Client().$extends({
  query: {
    respondent: {
      create({ args, query }) {
        args.data = RespondentCreateSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = RespondentCreateSchema.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = RespondentCreateSchema.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = RespondentCreateSchema.parse(args.create);
        args.update = RespondentCreateSchema.partial().parse(args.update);
        return query(args);
      },
    },
  },
});
