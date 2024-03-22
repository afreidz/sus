import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";
import { int8ArrayToBuffer } from "@/helpers/image";
import orm, { RespondentCreateSchema } from "./schema";

export type questions = {
  POST: ORM.QuestionGetPayload<{}>;
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  data.media = int8ArrayToBuffer(data.media);

  const parsed = RespondentCreateSchema.parse(data);

  const question = await orm.question.create({
    data: {
      text: parsed.text,
      media: parsed.media,
      createdBy: parsed.createdBy,
      mediaMIME: parsed.mediaMIME,
      mediaLocation: parsed.mediaLocation,
    },
  });

  return new Response(JSON.stringify(question), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
