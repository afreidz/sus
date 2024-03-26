import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";
import { int8ArrayToBuffer } from "@/helpers/image";
import orm, { QuestionCreateSchema } from "./schema";

export type questions = {
  POST: ORM.QuestionGetPayload<{}>;
};

export const POST: APIRoute = async ({ request }) => {
  // const data = await request.json();
  // console.log("ANDY", data.revisionId);
  // data.media = int8ArrayToBuffer(data.media);

  // const parsed = QuestionCreateSchema.parse(data);

  // const question = await orm.question.create({
  //   data: {
  //     text: parsed.text,
  //     media: parsed.media,
  //     createdBy: parsed.createdBy,
  //     mediaMIME: parsed.mediaMIME,
  //     mediaLocation: parsed.mediaLocation,
  //     surveys: {
  //       create: {
  //         assignedBy: parsed.createdBy,
  //         survey: {
  //           connect: { id: parsed.surveyId },
  //         },
  //       },
  //     },
  //   },
  // });

  // await Promise.all(
  //   parsed.responses.map((response) => {
  //     return orm.questionResponse.create({
  //       data: {
  //         responseId: response,
  //         questionId: question.id,
  //         assignedBy: parsed.createdBy,
  //       },
  //     });
  //   })
  // );

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
