import { type APIRoute } from "astro";

export const POST: APIRoute = async ({ params, request }) => {
  const body = await request.json();
  console.log(params, body);

  return new Response(null, {
    status: 200,
  });
};
