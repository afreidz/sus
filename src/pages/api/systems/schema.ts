import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";

export const SystemSchema = z.object({
  clientId: z.string(),
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  title: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\.,\-_'"]*$/),
}) satisfies z.Schema<Prisma.SystemUncheckedCreateInput>;

export const SystemsSchema = z.array(SystemSchema) satisfies z.Schema<
  Prisma.SystemUncheckedCreateInput[]
>;

export default new PrismaClient().$extends({
  query: {
    system: {
      create({ args, query }) {
        args.data = SystemSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = SystemSchema.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = SystemSchema.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = SystemSchema.parse(args.create);
        args.update = SystemSchema.partial().parse(args.update);
        return query(args);
      },
    },
  },
});
