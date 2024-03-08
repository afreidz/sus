import auth from "auth-astro";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 20000,
  },
  redirects: {
    "/": "/clients",
  },
  vite: {
    envPrefix: "PUBLIC_",
  },
  output: "server",
  adapter: vercel(),
  integrations: [svelte(), tailwind(), auth()],
});
