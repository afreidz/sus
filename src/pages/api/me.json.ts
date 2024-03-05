import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import type { Session } from "@auth/core/types";

export type me = {
  GET: Session;
};

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);

  return new Response(JSON.stringify(session), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
