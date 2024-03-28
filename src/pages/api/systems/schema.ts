import { safeTextRegEx } from "@/helpers/strings";
import Client, { z, type ORM } from "@/helpers/orm";

export const SystemSchema = z.object({
  clientId: z.string(),
  createdBy: z.string(),
  updatedAt: z.date().optional(),
  title: z.string().min(2).max(100).regex(safeTextRegEx),
}) satisfies z.Schema<ORM.SystemUncheckedCreateInput>;

export const SystemsSchema = z.array(SystemSchema) satisfies z.Schema<
  ORM.SystemUncheckedCreateInput[]
>;

export default new Client().$extends({
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
