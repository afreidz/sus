import { defineConfig } from "auth-astro";
import Azure from "@auth/core/providers/azure-ad";

export default defineConfig({
  providers: [
    Azure({
      clientId: import.meta.env.AZURE_AD_CLIENT_ID,
      tenantId: import.meta.env.AZURE_AD_TENNANT_ID,
      clientSecret: import.meta.env.AZURE_AD_CLIENT_SECRET,
    }),
  ],
});
