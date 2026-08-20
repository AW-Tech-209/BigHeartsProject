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
   * Clave AES-256-GCM con la que se cifra `Classroom.meetingLink`
   * (`docs/ARQUITECTURA.md` §4.1). OBLIGATORIA y sin default, por el mismo
   * motivo que `JWT_SECRET`: una clave por defecto convertiría el cifrado en
   * decorado el día que alguien despliegue sin configurarla.
   *
   * Se exige **64 caracteres hexadecimales = 32 bytes exactos**, que es lo que
   * AES-256 necesita, en vez de "una cadena larga". Con una longitud libre
   * habría que derivar la clave o rellenarla, y ambas cosas esconden un error de
   * configuración detrás de un cifrado más débil de lo que el nombre promete.
   * Aquí una clave mal puesta se detecta al arrancar, no al descifrar.
   *
   *   openssl rand -hex 32
   *
   * ⚠️ Cambiarla deja ILEGIBLES los enlaces ya guardados: no hay rotación de
   * claves en Fase 1 (el prefijo `v1.` del texto cifrado es el gancho para
   * añadirla sin migrar datos).
   */
  MEETING_LINK_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'debe ser una clave de 64 caracteres hexadecimales (32 bytes). Genérala con: openssl rand -hex 32',
    ),

  /**
   * Vida del Access Token JWT. Formato de `ms`/jsonwebtoken (p. ej. `15m`, `1h`).
   * Corto a propósito: si se roba, caduca pronto. La sesión larga la sostiene el
   * refresh token. Opcional: por defecto 15 minutos.
   */
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

  /**
   * Vida del Refresh Token, en días. La sesión sobrevive recargas y visitas
   * durante este tiempo mientras se vaya renovando. Opcional: por defecto 30.
   */
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),

  /**
   * Rate limiting de los endpoints sensibles de `/auth` (login y register).
   * Ventana en segundos y nº máximo de intentos por IP dentro de esa ventana.
   * Frena fuerza bruta y enumeración. Opcionales: por defecto 5 intentos / 60 s.
   */
  AUTH_THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),

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

  /**
   * Orígenes permitidos por CORS en staging/producción, separados por comas.
   * Ejemplo: CORS_ORIGIN=https://academia-web.vercel.app,https://academia.app
   *
   * En development se IGNORA (se permite cualquier localhost). Opcional: si no
   * se define en staging/prod, no se habilita CORS y el navegador bloqueará al
   * frontend desplegado. Por eso, al desplegar, hay que definirla.
   */
  CORS_ORIGIN: z.string().optional(),

  /**
   * Si está activo, los profesores se registran con status PENDING (a la espera
   * de aprobación); los estudiantes siempre nacen ACTIVE. Si se desactiva, los
   * profesores también nacen ACTIVE. Llega como string desde el entorno.
   * Opcional: por defecto `true`.
   */
  TEACHER_APPROVAL_REQUIRED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

/** Variables de entorno ya validadas y con los tipos correctos. */
export type Env = z.infer<typeof envSchema>;
