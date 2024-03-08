import orm from "../schema";
import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";

export type surveyType = {
  GET: ORM.SurveyGetPayload<{}>[];
};

export const GET: APIRoute = async ({ params }) => {
  const survey = await orm.survey.findMany({
    where: { id: params.id, scoreType: { id: params.type } },
  });

  return new Response(JSON.stringify(survey), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
