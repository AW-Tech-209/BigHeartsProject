import { z } from 'zod';

/**
 * Esquema de las variables de entorno que necesita la API.
 *
 * Es la ÚNICA fuente de verdad: el tipo `Env` se infiere de aquí, así que el
 * esquema y los tipos no pueden desincronizarse.
 *
 * Reglas:
 *  - Si una variable tiene `.default(...)`, es opcional.
 *  - Si no lo tiene, es OBLIGATORIA y la app no arrancará sin ella.
 */
export const envSchema = z.object({
  /** Entorno de ejecución. Opcional: por defecto `development`. */
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  /**
   * Puerto HTTP. Llega como string desde el entorno, por eso `coerce`.
   * Opcional: por defecto 3000.
   */
  PORT: z.coerce.number().int().positive().max(65535).default(3000),

  /**
   * Secreto para firmar los JWT. OBLIGATORIA y sin default a propósito:
   * un valor por defecto aquí sería un agujero de seguridad esperando a que
   * alguien despliegue a producción sin darse cuenta.
   */
  JWT_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),

  // TODO(Prisma): cuando entre la base de datos, añadir aquí:
  //   DATABASE_URL: z.string().url(),
  // y su correspondiente entrada en .env.example.
});

/** Variables de entorno ya validadas y con los tipos correctos. */
export type Env = z.infer<typeof envSchema>;
