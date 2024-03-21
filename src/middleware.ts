import { getSession } from "auth-astro/server";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/public") ||
    url.pathname.startsWith("/auth/login") ||
    url.pathname.startsWith("/surveys/sus")
  )
    return next();

  if (!(await getSession(context.request))) {
    if (!url.pathname.startsWith("/api")) {
      return context.redirect("/auth/login");
    }

    return new Response(JSON.stringify({ message: "unauthorized" }), {
      status: 401,
    });
  }

  return next();
});
