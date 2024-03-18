import type { APIRoute } from "astro";
import type { ORM } from "@/helpers/orm";
import orm from "../../respondents/schema";

export type publicRespondentId = {
  PUT: ORM.RespondentGetPayload<{}>;
};

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();

  const respondent = await orm.respondent.update({
    where: { id: params.id },
    data: { complete: data.complete ?? false },
  });

  return new Response(JSON.stringify(respondent), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
