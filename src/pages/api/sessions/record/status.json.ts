import { type APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
  const body = await request.json();
  console.log(params, body);

  return new Response(null, {
    status: 200,
  });
};
