import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema';

/**
 * Acceso tipado a la configuración de la aplicación.
 *
 * El resto de la app NUNCA debe leer `process.env` directamente: debe inyectar
 * este servicio. Motivos:
 *  - `process.env` devuelve `string | undefined`; aquí los tipos son reales
 *    (`port` es `number`, `nodeEnv` es una unión cerrada).
 *  - Todo lo que se lea aquí ha pasado por el esquema de validación.
 *  - En tests, este servicio se puede sustituir por un mock.
 */
@Injectable()
export class AppConfigService {
  // El segundo parámetro genérico (`true`) le dice a ConfigService que la
  // configuración está validada, de modo que `get()` devuelve el valor sin
  // `undefined` y no hay que meter `!` por todas partes.
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }

  /**
   * Clave AES-256-GCM del enlace de reunión, en hexadecimal (64 caracteres).
   * La consume `MeetingLinkCipher`; nadie más debería leerla.
   */
  get meetingLinkKey(): string {
    return this.config.get('MEETING_LINK_KEY', { infer: true });
  }

  /** Vida del Access Token JWT (formato `ms`, p. ej. `15m`). */
  get jwtAccessExpiresIn(): string {
    return this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
  }

  /** Vida del Refresh Token, en días. */
  get refreshTokenTtlDays(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
  }

  /** Ventana (segundos) del rate limiting de los endpoints de `/auth`. */
  get authThrottleTtl(): number {
    return this.config.get('AUTH_THROTTLE_TTL', { infer: true });
  }

  /** Máximo de intentos por IP dentro de la ventana de rate limiting de `/auth`. */
  get authThrottleLimit(): number {
    return this.config.get('AUTH_THROTTLE_LIMIT', { infer: true });
  }

  /** Conexión a PostgreSQL en runtime (pooler pgbouncer). */
  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  /** Conexión directa a PostgreSQL, usada por Prisma Migrate. */
  get directUrl(): string {
    return this.config.get('DIRECT_URL', { infer: true });
  }

  /**
   * Orígenes permitidos por CORS en staging/producción, ya parseados a lista.
   * Vacío si no se ha configurado `CORS_ORIGIN`.
   */
  get corsOrigins(): string[] {
    const raw = this.config.get('CORS_ORIGIN', { infer: true });

    if (!raw) {
      return [];
    }

    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  /**
   * Si los profesores requieren aprobación (nacen PENDING). Ver la regla de
   * negocio en AuthService.
   */
  get teacherApprovalRequired(): boolean {
    return this.config.get('TEACHER_APPROVAL_REQUIRED', { infer: true });
  }

  /**
   * Antelación mínima, en minutos, con la que se publica un aula (§4.4).
   * **Aviso confirmable, no bloqueo**: ver `CLASS_MIN_LEAD_MINUTES` en el
   * esquema.
   */
  get classMinLeadMinutes(): number {
    return this.config.get('CLASS_MIN_LEAD_MINUTES', { infer: true });
  }

  /** Duración máxima de un aula, en minutos (§4.4). Este bloquea. */
  get classMaxDurationMinutes(): number {
    return this.config.get('CLASS_MAX_DURATION_MINUTES', { infer: true });
  }

  /** Hasta cuántos minutos antes del inicio se puede cancelar una reserva (§4.3). */
  get cancellationWindowMinutes(): number {
    return this.config.get('CANCELLATION_WINDOW_MINUTES', { infer: true });
  }

  /** Minutos antes de `scheduledAt` en los que se abre el acceso al enlace (§4.1). */
  get accessWindowMinutes(): number {
    return this.config.get('ACCESS_WINDOW_MINUTES', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
