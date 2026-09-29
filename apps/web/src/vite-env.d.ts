/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de @academia/api. Obligatoria: ver apps/web/.env.example. */
  readonly VITE_API_URL: string;
  /** Plazo (ms) del refresh del arranque antes de caer a `anonymous`. Por defecto 3000. */
  readonly VITE_SESSION_REFRESH_TIMEOUT_MS?: string;
  /** WhatsApp de soporte: solo dígitos con indicativo (573001234567). Opcional. */
  readonly VITE_SUPPORT_WHATSAPP?: string;
  /** Correo de soporte. Opcional. */
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
