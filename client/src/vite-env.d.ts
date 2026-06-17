/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API. Defaults to the Vite-proxied '/api/v1' in dev. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
