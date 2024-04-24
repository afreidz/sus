/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string;
  readonly PUBLIC_API_ORIGIN: string;
  readonly PUBLIC_SPEECH_KEY: string;
  readonly PUBCIC_SPEECH_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
