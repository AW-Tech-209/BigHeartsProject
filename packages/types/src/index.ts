/**
 * Tipos compartidos entre el backend (@academia/api) y el frontend (@academia/web).
 *
 * Todo lo que viva aquí debe ser agnóstico de framework: nada de decoradores de
 * NestJS, nada de tipos de React. Solo el contrato de datos que cruza la red.
 *
 * Es la ÚNICA fuente de verdad del contrato entre back y front. El backend
 * decora sus DTOs con class-validator a partir de estos tipos; el frontend
 * pinta el formulario a partir de los mismos.
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

/**
 * Roles con los que un usuario puede AUTO-registrarse. ADMIN queda fuera a
 * propósito: solo se crea vía seed/administración, nunca desde el formulario.
 */
export type RegisterableRole = UserRole.STUDENT | UserRole.TEACHER;

/**
 * Estado de la cuenta.
 *  - ACTIVE: puede usar la plataforma.
 *  - PENDING: registrada pero a la espera de aprobación (profesores).
 *  - SUSPENDED: deshabilitada por un administrador.
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

/** Nivel de hipoacusia (pérdida auditiva) declarado por el usuario. */
export enum HearingLossLevel {
  NONE = 'NONE',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  PROFOUND = 'PROFOUND',
}

/** Preferencia de comunicación del usuario, para adaptar la experiencia. */
export enum CommunicationPreference {
  SIGN_LANGUAGE = 'SIGN_LANGUAGE',
  LIP_READING = 'LIP_READING',
  WRITTEN_TEXT = 'WRITTEN_TEXT',
  SPOKEN_AUDIO = 'SPOKEN_AUDIO',
}

/**
 * Vista pública de un usuario: la forma en que viaja por la API hacia el
 * frontend.
 *
 * IMPORTANTE: NO incluye `password` ni ningún dato sensible. El modelo `User`
 * de Prisma (backend) sí lo tiene; este tipo es deliberadamente un subconjunto,
 * para que sea imposible serializar el hash por accidente.
 *
 * Las fechas son cadenas ISO 8601, porque así es como sobreviven a `JSON`.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  /** `null` si el usuario no lo declaró. */
  hearingLossLevel: HearingLossLevel | null;
  /** `null` si el usuario no lo declaró. */
  communicationPreference: CommunicationPreference | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cuerpo de la petición de registro (`POST /auth/register`).
 *
 * Los campos de accesibilidad son opcionales: no obligamos a declararlos.
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RegisterableRole;
  hearingLossLevel?: HearingLossLevel;
  communicationPreference?: CommunicationPreference;
}

/** Respuesta de un registro correcto. El `status` del usuario guía el mensaje. */
export interface RegisterResponse {
  user: User;
}

/**
 * Cuerpo de la petición de login (`POST /auth/login`).
 *
 * Solo email y contraseña: el resto de la sesión (tokens) lo emite el backend.
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Sesión que devuelve un login o un refresh correctos.
 *
 * Contrato del flujo de tokens acordado entre backend y frontend (ver
 * AUTH_FLOW.md):
 *  - `accessToken`: JWT de vida corta. El frontend lo guarda EN MEMORIA (no en
 *    localStorage) y lo manda en `Authorization: Bearer <token>`.
 *  - `expiresIn`: segundos de validez del access token, para que el frontend
 *    programe la renovación silenciosa antes de que caduque.
 *  - El REFRESH token NO viaja en este cuerpo: vive en una cookie httpOnly que
 *    el navegador gestiona solo. Por eso no aparece aquí (JS no debe leerlo).
 */
export interface AuthSession {
  user: User;
  accessToken: string;
  /** Segundos hasta que el access token caduca (p. ej. 900 = 15 min). */
  expiresIn: number;
}

/** Respuesta de `POST /auth/login`. */
export type LoginResponse = AuthSession;

/** Respuesta de `POST /auth/refresh`. Misma forma que el login. */
export type RefreshResponse = AuthSession;

/** Códigos de error estables que la API puede devolver en `ApiError.code`. */
export const ApiErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  /** Email o contraseña incorrectos en el login. Mensaje deliberadamente genérico. */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /** La cuenta está suspendida por un administrador. */
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  /** La cuenta está pendiente de aprobación (profesor). No puede iniciar sesión aún. */
  ACCOUNT_PENDING: 'ACCOUNT_PENDING',
  /** Falta el token, o es inválido/expirado, en una ruta protegida. */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  /** El refresh token no existe, expiró, o ya fue revocado/usado. */
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  /** Se superó el límite de peticiones (rate limiting). */
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/**
 * Error de validación de un campo concreto. Es el contrato que el formulario
 * usa para pintar el mensaje bajo cada input.
 */
export interface ValidationErrorDetail {
  /** Nombre del campo, p. ej. `email`. */
  field: string;
  /** Mensaje legible para el usuario. */
  message: string;
}

/** Error normalizado que devuelve la API cuando algo falla. */
export interface ApiError {
  /** Código estable y legible por máquina; ver `ApiErrorCode`. */
  code: string;
  /** Mensaje pensado para que un humano lo lea. */
  message: string;
  /**
   * Detalles opcionales. En errores de validación (`VALIDATION_ERROR`) contiene
   * `{ fields: ValidationErrorDetail[] }`.
   */
  details?: {
    fields?: ValidationErrorDetail[];
  } & Record<string, unknown>;
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
