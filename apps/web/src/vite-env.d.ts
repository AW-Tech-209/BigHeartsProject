/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de @academia/api. Obligatoria: ver apps/web/.env.example. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
