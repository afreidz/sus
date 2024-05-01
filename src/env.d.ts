/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_ORIGIN: string;
  readonly PUBLIC_SPEECH_KEY: string;
  readonly PUBCIC_SPEECH_REGION: string;
  readonly PUBLIC_STORAGE_ACCOUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
