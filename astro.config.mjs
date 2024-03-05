import auth from "auth-astro";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3333,
  },
  redirects: {
    "/": "/clients",
  },
  output: "server",
  adapter: vercel(),
  integrations: [svelte(), tailwind(), auth()],
});
