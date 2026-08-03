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
/**
 * Cadena de conexión a PostgreSQL. Se valida como URL y, además, que use el
 * esquema `postgres(ql)://`, para cazar el típico valor mal pegado.
 */
const postgresUrl = z
  .string()
  .url('debe ser una URL de conexión válida')
  .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
    message: 'debe empezar por postgresql://',
  });

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

  /**
   * Conexión a PostgreSQL en RUNTIME. En Supabase, el pooler en modo
   * transacción (pgbouncer, puerto 6543). La usa Prisma Client para las
   * consultas normales de la app.
   */
  DATABASE_URL: postgresUrl,

  /**
   * Conexión DIRECTA a PostgreSQL, en modo sesión (puerto 5432). La usa Prisma
   * Migrate: pgbouncer no soporta las sentencias de migración, por eso se
   * separa de DATABASE_URL. Ver prisma/schema.prisma (`directUrl`).
   */
  DIRECT_URL: postgresUrl,
});

/** Variables de entorno ya validadas y con los tipos correctos. */
export type Env = z.infer<typeof envSchema>;
