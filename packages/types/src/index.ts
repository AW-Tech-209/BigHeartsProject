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

/**
 * Nivel de inglés de un aula. Coincide con `EnglishLevel` de `schema.prisma`.
 *
 * Son tres a propósito y no un catálogo fino (A1/A2/B1…): el estudiante elige
 * con esta etiqueta y con la descripción de la clase, no con una escala del
 * Marco Común Europeo que obligaría a aprenderse otra taxonomía antes de poder
 * reservar.
 */
export enum EnglishLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

/**
 * Estado del aula. Coincide con `ClassroomStatus` de `schema.prisma`.
 *
 * En Fase 1 solo hay DOS escritores: `POST /classrooms` la crea `PUBLISHED`
 * (D15) y HU-202 la pasa a `CANCELLED`.
 *
 *  - `DRAFT` está reservado para Fase 1.5 y **nadie lo escribe**: crear un aula
 *    tiene que costar menos que abrir un grupo de WhatsApp, y un paso extra de
 *    publicación es fricción sin beneficio.
 *  - `COMPLETED` **tampoco tiene escritor** (D16). "Ya terminó" se deriva del
 *    tiempo (`now ≥ scheduledAt + durationMinutes`), así que una regla escrita
 *    contra este valor no se dispararía nunca. Lo persistirá HU-404, cuando el
 *    profesor cierre la clase al marcar asistencia.
 */
export enum ClassroomStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * De dónde salió el enlace de la videollamada. Coincide con `MeetingProvider`
 * de `schema.prisma`.
 *
 * En Fase 1 **siempre** es `MANUAL`: el profesor crea la reunión en Zoom o Meet
 * y pega el enlace. Los otros tres valores existen para que integrar generación
 * automática (Fase 1.5) no obligue a una migración de enum con datos dentro.
 */
export enum MeetingProvider {
  MANUAL = 'MANUAL',
  DAILY = 'DAILY',
  GOOGLE_MEET = 'GOOGLE_MEET',
  ZOOM = 'ZOOM',
}

/**
 * Vista pública de un aula: la forma en que viaja por la API hacia el frontend.
 *
 * **`meetingLink` es opcional y se OMITE, no se envía vacío.** Es el mismo
 * patrón que `User` sin `password`, pero por un motivo distinto: aquí el campo
 * a veces sí puede viajar. La regla la decide el servidor (`ARQUITECTURA.md`
 * §4.1) —el profesor dueño lo ve siempre; un estudiante solo con reserva
 * `CONFIRMED` y dentro de los 30 minutos previos— y cuando no aplica, la clave
 * no aparece en el JSON. Ni cifrada, ni en `null`, ni escondida en otro campo:
 * el frontend nunca debe recibir algo que no puede mostrar.
 *
 * Que el tipo lo declare `?` es lo que obliga al frontend a tratar su ausencia
 * como el caso normal en vez de como un error.
 *
 * Las fechas son cadenas ISO 8601 en UTC (§4.7). Quien las pinta las formatea a
 * la zona del usuario y **siempre nombra la zona**.
 */
export interface Classroom {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  level: EnglishLevel;
  /** Cupo máximo de estudiantes. */
  maxStudents: number;
  /**
   * Reservas `CONFIRMED` vigentes. **Solo se muta dentro de la transacción de
   * reserva** (§4.2); en Sprint 2 nadie lo toca y siempre vale 0.
   */
  currentBookings: number;
  /** Instante de inicio, ISO 8601 en UTC. */
  scheduledAt: string;
  durationMinutes: number;
  meetingProvider: MeetingProvider;
  status: ClassroomStatus;
  /** Gancho de Fase 1.5. En Fase 1 no hay ninguna regla de recurrencia. */
  isRecurring: boolean;
  /** Presente SOLO cuando el servidor decide revelarlo. Ver arriba. */
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cuerpo de la petición de creación de aula (`POST /classrooms`).
 *
 * Es DELIBERADAMENTE un subconjunto de `Classroom`. Lo que NO está aquí, y por
 * qué:
 *  - `teacherId` sale del token, nunca del cuerpo. Aceptarlo sería dejar que un
 *    profesor publicara clases a nombre de otro.
 *  - `status` nace `PUBLISHED` (D15) y `currentBookings` en `0`: no son
 *    decisiones del formulario.
 *  - `meetingProvider` es `MANUAL` en toda la Fase 1.
 *  - `isRecurring` no se ofrece: la columna existe, la funcionalidad no.
 *
 * Añadir un campo a este tipo es autorizar a que el cliente lo decida.
 */
export interface CreateClassroomInput {
  title: string;
  description: string;
  level: EnglishLevel;
  maxStudents: number;
  /** Instante de inicio, ISO 8601. Debe ser futuro; lo comprueba el servidor. */
  scheduledAt: string;
  durationMinutes: number;
  /** URL de la reunión que el profesor creó en Zoom o Meet. Se guarda cifrada. */
  meetingLink: string;
}

/**
 * Respuesta de `POST /classrooms`.
 *
 * Devuelve el aula ya creada —con su `id`, su `status` y su `teacherId` reales—
 * para que la pantalla anuncie el resultado con el dato del servidor y pueda
 * navegar al detalle sin una segunda petición.
 */
export interface CreateClassroomResponse {
  classroom: Classroom;
}

/** Tamaño de página por defecto de `GET /classrooms` cuando no se pide uno. */
export const CLASSROOMS_PAGE_SIZE_DEFAULT = 20;

/**
 * Tope máximo de `pageSize` que acepta `GET /classrooms`. Sin él, cualquiera
 * podría pedir diez mil filas de un tirón (HU-203, A4).
 */
export const CLASSROOMS_PAGE_SIZE_MAX = 100;

/**
 * Query de `GET /classrooms` (HU-203). Todos los campos son opcionales y
 * combinables entre sí: sin ninguno, devuelve la primera página del catálogo
 * completo.
 */
export interface ListClassroomsQuery {
  level?: EnglishLevel;
  /** ISO 8601. Cota inferior de `scheduledAt`, combinable con `hasta`. */
  desde?: string;
  /** ISO 8601. Cota superior de `scheduledAt`, combinable con `desde`. */
  hasta?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Una fila del listado: el aula pública más el nombre de su profesor.
 *
 * Es deliberadamente `Classroom` + dos campos planos, no un objeto `teacher`
 * anidado — mismo patrón de aplanado que el resto del tipo, y evita que el
 * frontend reciba (y tenga que ignorar) el email o el id del profesor, que
 * esta pantalla no necesita.
 */
export interface ClassroomListItem extends Classroom {
  teacherFirstName: string;
  teacherLastName: string;
}

/**
 * Respuesta de `GET /classrooms`. Paginación por página, no por cursor
 * (decisión de HU-203: propuesta mía, no estaba fijada en ningún otro sitio).
 */
export interface ListClassroomsResponse {
  items: ClassroomListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Filtro temporal de «Mis aulas» (`GET /classrooms/mias`, HU-207).
 *
 * Los tres primeros valores son **disjuntos y exhaustivos**: cada aula del
 * profesor cae en uno y solo en uno, y `todas` es su unión. Esa disyunción es
 * la especificación, no un detalle:
 *
 *  - `canceladas` — `status = CANCELLED`, **sea cual sea su fecha**. Una clase
 *    cancelada la semana que viene no es una próxima: no hay nada que preparar.
 *  - `pasadas` — no cancelada y con el horario ya cumplido.
 *  - `proximas` — no cancelada y con el horario por venir.
 *
 * Los valores van en minúscula y en español porque viajan **en la URL** y el
 * profesor los ve al copiar el enlace (`?estado=canceladas`). El resto de enums
 * del contrato son espejos de columnas de la BD; este no lo es.
 */
export enum EstadoTemporalAula {
  PROXIMAS = 'proximas',
  PASADAS = 'pasadas',
  CANCELADAS = 'canceladas',
  TODAS = 'todas',
}

/** El filtro con el que se abre «Mis aulas» si nadie pide otro (A2). */
export const ESTADO_TEMPORAL_POR_DEFECTO = EstadoTemporalAula.TODAS;

/**
 * Query de `GET /classrooms/mias` (HU-207).
 *
 * **No declara `teacherId`, y eso es la autorización.** El alcance sale del
 * token; sin forma de nombrar a un tercero no hay aulas ajenas que proteger
 * (`ARQUITECTURA.md` §4.8, regla 3). Es la misma decisión que en `/users/me`.
 */
export interface MisAulasQuery {
  /** Por defecto, `todas`: es el registro del profesor, no su agenda. */
  estado?: EstadoTemporalAula;
  page?: number;
  pageSize?: number;
}

/**
 * Respuesta de `GET /classrooms/mias`. Mismo formato de paginación que el
 * catálogo (A5): un solo contrato de listado en toda la API.
 *
 * Los elementos son `Classroom` a secas —el tipo de HU-201—, **no
 * `ClassroomListItem`**: el nombre del profesor que el catálogo necesita para
 * la tarjeta aquí sobra, porque el profesor es quien pide. `maxStudents` y
 * `currentBookings` ya viajan en él, que es lo que la tarjeta de esta pantalla
 * convierte en «3 de 10 inscritos».
 *
 * **`meetingLink` no viaja**, ni siquiera al dueño: es un listado, y §4.8
 * regla 2 no admite excepción por rol. Lo revela el detalle (HU-204).
 */
export interface MisAulasResponse {
  items: Classroom[];
  total: number;
  page: number;
  pageSize: number;
}

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

/**
 * `derivarEstadoAula()` y los tipos de los 9 estados de UI viven en su propio
 * archivo (HU-203): es lógica de negocio compartida con sus propios tests, no
 * un tipo más de este archivo.
 */
export * from './estado-aula';
