import Client, { z, type ORM } from "@/helpers/orm";

export const ClientCreateSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\.,\-_'"]*$/),
  createdBy: z.string(),
  updatedAt: z.date().optional(),
}) satisfies z.Schema<ORM.ClientUncheckedCreateInput>;

export default new Client().$extends({
  query: {
    client: {
      create({ args, query }) {
        args.data = ClientCreateSchema.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = ClientCreateSchema.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = ClientCreateSchema.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = ClientCreateSchema.parse(args.create);
        args.update = ClientCreateSchema.partial().parse(args.update);
        return query(args);
      },
    },
  },
});
