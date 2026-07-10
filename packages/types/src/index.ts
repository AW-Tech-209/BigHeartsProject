/**
 * Tipos compartidos entre el backend (@academia/api) y el frontend (@academia/web).
 *
 * Todo lo que viva aquí debe ser agnóstico de framework: nada de decoradores de
 * NestJS, nada de tipos de React. Solo el contrato de datos que cruza la red.
 *
 * Los tipos de este archivo son PLACEHOLDERS de la HU-001 y se ampliarán en las
 * siguientes HUs (entidades de usuario, aula, reserva, sesión...).
 */

/**
 * Roles de usuario de la plataforma.
 *
 * Es un `enum` de TypeScript (no un `const enum`) a propósito: emite un objeto
 * en tiempo de ejecución, de modo que el backend puede validarlo contra la BD y
 * el frontend puede iterarlo para pintar selectores.
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

/** Error normalizado que devuelve la API cuando algo falla. */
export interface ApiError {
  /** Código estable y legible por máquina, p. ej. `USER_NOT_FOUND`. */
  code: string;
  /** Mensaje pensado para que un humano lo lea. */
  message: string;
  /** Detalles opcionales, p. ej. errores de validación por campo. */
  details?: Record<string, unknown>;
}

/**
 * Envoltorio base de toda respuesta de la API.
 *
 * Se modela como unión discriminada por `success`, así TypeScript estrecha el
 * tipo automáticamente: si `success === true`, `data` está garantizado.
 */
export type ApiResponse<TData = unknown> =
  | {
      success: true;
      data: TData;
      timestamp: string;
    }
  | {
      success: false;
      error: ApiError;
      timestamp: string;
    };
