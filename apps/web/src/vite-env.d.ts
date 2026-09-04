/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de @academia/api. Obligatoria: ver apps/web/.env.example. */
  readonly VITE_API_URL: string;
  /** Plazo (ms) del refresh del arranque antes de caer a `anonymous`. Por defecto 3000. */
  readonly VITE_SESSION_REFRESH_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
