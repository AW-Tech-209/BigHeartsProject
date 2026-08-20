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
 *  - REJECTED: el administrador denegó la solicitud; nunca llegó a estar activa.
 *  - SUSPENDED: estaba activa y un administrador la deshabilitó.
 *
 * `REJECTED` y `SUSPENDED` son estados DISTINTOS a propósito (decisión D13 de
 * `docs/ARQUITECTURA.md` §4.5). Reutilizar `SUSPENDED` para un rechazo
 * obligaría a decirle a un profesor "tu cuenta fue suspendida" cuando nunca
 * estuvo activa, y el microcopy de este producto es deliberadamente literal:
 * quien lee español como segunda lengua paga cara esa imprecisión.
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
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
 * Cuerpo de la petición de edición del perfil propio (`PATCH /users/me`).
 *
 * Es DELIBERADAMENTE un subconjunto de `User`: solo lo que el dueño de la
 * cuenta puede cambiar por sí mismo. `email` y `role` están fuera a propósito
 * —el primero necesita verificación por correo, el segundo es una decisión de
 * administración— y `id`/`status`/timestamps no los edita nadie desde aquí.
 * Añadir un campo a este tipo es autorizar a editarlo: piénsalo dos veces.
 *
 * Los campos de accesibilidad son opcionales y admiten `null` explícito: es la
 * forma de RETIRAR una preferencia ya declarada. Omitir la clave significa
 * "no la toques"; mandar `null` significa "bórrala".
 */
export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  hearingLossLevel?: HearingLossLevel | null;
  communicationPreference?: CommunicationPreference | null;
}

/** Respuesta de `GET /users/me` y de `PATCH /users/me`. */
export interface ProfileResponse {
  user: User;
}

/**
 * Respuesta de `GET /admin/teachers/pending`.
 *
 * Es una lista sin paginar a propósito: el número de profesores esperando
 * aprobación se mide en decenas, no en miles, y una cola de aprobación que
 * crece sin límite es un problema de operación, no de paginación. Si algún día
 * hiciera falta, se añade con el formato que se acuerde para el listado de
 * aulas (`docs/ARQUITECTURA.md` §14.6 nº6), no con uno propio.
 *
 * Los elementos son `User` completos —no un subconjunto— porque el
 * administrador decide con el nombre, el email y la fecha de solicitud, y todos
 * viven ya en la vista pública. `status` siempre vale `PENDING` y `role`
 * siempre `TEACHER`: filtrar es trabajo del servidor, no de la tabla.
 */
export interface PendingTeachersResponse {
  teachers: User[];
}

/**
 * Respuesta de `POST /admin/teachers/:id/approve` y `.../reject`.
 *
 * Devuelve el profesor YA con su estado nuevo, para que la pantalla pueda
 * anunciar el resultado con el dato del servidor en vez de con lo que creía
 * haber pedido.
 */
export interface TeacherApprovalResponse {
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
  /**
   * El administrador denegó la solicitud de registro del profesor.
   *
   * Es un código propio y NO `ACCOUNT_SUSPENDED`: los dos impiden entrar, pero
   * dicen cosas distintas y el frontend muestra mensajes distintos. Ver D13.
   */
  ACCOUNT_REJECTED: 'ACCOUNT_REJECTED',
  /**
   * Se pidió un cambio de estado que las reglas de §4.5 no permiten: aprobar o
   * rechazar a alguien que no es profesor, o que ya no está `PENDING`.
   *
   * Es 409 y no 404: el usuario existe, lo que no existe es la transición.
   */
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  /** Falta el token, o es inválido/expirado, en una ruta protegida. */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  /**
   * Hay sesión válida, pero el rol no alcanza para este endpoint.
   *
   * Distinto de `UNAUTHENTICATED` (que se resuelve iniciando sesión) y de
   * `PROFILE_FORBIDDEN` (que es del dominio del perfil ajeno): aquí la sesión
   * es correcta y volver a entrar no cambiaría nada. Lo emite el `RolesGuard`.
   */
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  /** El refresh token no existe, expiró, o ya fue revocado/usado. */
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  /**
   * Intento de leer o editar el perfil de otra persona.
   *
   * Hoy NINGÚN endpoint lo emite, y es intencional: `/users/me` deriva el id
   * del token (nunca de la ruta ni del cuerpo), así que no existe forma de
   * direccionar un perfil ajeno para que la petición llegue a fallar. El código
   * se reserva aquí porque el catálogo es API pública y los códigos se añaden,
   * no se renombran; lo emitirá `AdminModule` cuando exista la edición de
   * terceros. No inventes una ruta `/users/:id` solo para poder usarlo.
   */
  PROFILE_FORBIDDEN: 'PROFILE_FORBIDDEN',
  /**
   * El usuario referenciado no existe. En `/users/me` significa que el token
   * es válido pero la cuenta que nombra ya no está: el access token vive 15
   * min y se verifica solo por firma, así que sobrevive a que un administrador
   * borre la cuenta.
   */
  USER_NOT_FOUND: 'USER_NOT_FOUND',
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
