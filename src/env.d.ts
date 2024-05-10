/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ORIGIN: string;
  readonly AUTH_SECRET: string;
  readonly OPENAI_API_KEY: string;

  readonly AZURE_AD_CLIENT_ID: string;
  readonly AZURE_AD_TENNANT_ID: string;
  readonly AZURE_AD_CLIENT_SECRET: string;

  readonly AZURE_COMS_KEY: string;
  readonly AZURE_COMS_ENDPOINT: string;

  readonly AZURE_STORAGE_ACCOUNT_KEY: string;

  readonly PUBLIC_API_ORIGIN: string;
  readonly PUBLIC_SPEECH_REGION: string;

  readonly PUBLIC_SPEECH_KEY: string;
  readonly PUBLIC_STORAGE_ACCOUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
