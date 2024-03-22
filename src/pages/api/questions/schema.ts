import { int8ArrayToBuffer } from "@/helpers/image";
import Client, { z, type ORM } from "@/helpers/orm";

export const RespondentCreateSchema = z.object({
  text: z.string(),
  createdBy: z.string(),
  mediaMIME: z.string().optional(),
  mediaLocation: z.string().optional(),
  media: z.instanceof(Buffer).optional(),
}) satisfies z.Schema<ORM.QuestionUncheckedCreateInput>;

export default new Client().$extends({
  query: {
    question: {
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
