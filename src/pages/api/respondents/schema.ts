import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";

export const RespondentCreateSchema = z.object({
  revisionId: z.string(),
  createdBy: z.string(),
  email: z.string().email(),
}) satisfies z.Schema<Prisma.RespondentUncheckedCreateInput>;

export default new PrismaClient().$extends({
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
