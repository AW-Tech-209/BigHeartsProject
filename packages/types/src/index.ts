import type { EstadoAccesoEnlace } from './acceso-enlace';

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
 * A qué plataforma apunta el enlace de la videollamada. Coincide con
 * `MeetingProvider` de `schema.prisma`.
 *
 * Hasta HU-211 este campo siempre valía `MANUAL` y no significaba nada: el
 * profesor pegaba el enlace y ya. Desde HU-211 el profesor lo declara al crear
 * la clase, porque los subtítulos automáticos no funcionan igual en todas las
 * plataformas y el estudiante necesita saberlo para prepararse. El mecanismo
 * NO cambia — el enlace se sigue pegando a mano en los tres casos — solo pasa
 * a decir a qué plataforma apunta:
 *  - `ZOOM` / `GOOGLE_MEET` — el enlace es de esa plataforma.
 *  - `MANUAL` — "otra": cualquier plataforma que no sea Zoom o Meet. Es el
 *    valor con el que nacieron las aulas de antes de HU-211, y sigue siendo
 *    cierto para ellas (decisión 5: no se les inventa una plataforma).
 *  - `DAILY` — reservado, **sin escritor**. Gancho para cuando Fase 1.5
 *    integre generación automática; no se ofrece como opción manual.
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
  /**
   * En qué modos se imparte la clase (HU-211, `ARQUITECTURA.md` §4.9).
   *
   * **Array vacío significa «el profesor no lo ha indicado», nunca «no se
   * imparte en ningún modo».** Las aulas creadas antes de HU-211 se migran así
   * a propósito (decisión 5 de la HU): inventarles un modo por defecto sería
   * mentirle al estudiante sobre algo de lo que depende para seguir la clase.
   * Puede tener varios modos a la vez — una clase en señas con subtítulos en
   * vivo declara los dos — por eso es un conjunto y no un valor único.
   */
  communicationModes: CommunicationPreference[];
  /** Hay intérprete de lengua de señas. Distinto de impartirse en señas. */
  hasInterpreter: boolean;
  /** Hay subtítulos en vivo durante la clase. */
  hasLiveCaptions: boolean;
  /** Hay materiales visuales de apoyo. */
  hasVisualMaterials: boolean;
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
  /**
   * Obligatorio y no vacío (HU-211, AC1): un aula nueva no puede quedar «sin
   * indicar». Las que ya existían antes de esta HU sí pueden estarlo — esta
   * regla es solo de creación, `UpdateClassroomAccessibilityInput` es la vía
   * para completarlas.
   */
  communicationModes: CommunicationPreference[];
  /** Los tres apoyos son opcionales: por defecto, ninguno. */
  hasInterpreter?: boolean;
  hasLiveCaptions?: boolean;
  hasVisualMaterials?: boolean;
  /**
   * Solo `MANUAL` (Otra), `GOOGLE_MEET` o `ZOOM`. `DAILY` no se ofrece: está
   * reservado para cuando Fase 1.5 genere el enlace automáticamente, y no
   * tiene sentido como respuesta a "¿a qué plataforma apunta el enlace que
   * acabas de pegar?".
   */
  meetingProvider: MeetingProvider;
  /**
   * El profesor ya vio el aviso de poca antelación y decidió publicar igual
   * (HU-212, AC7).
   *
   * **No es un dato del aula: no se persiste ni viaja de vuelta en
   * `Classroom`.** Es el acuse de recibo de un aviso. Sin él, un `scheduledAt`
   * por debajo de `CLASS_MIN_LEAD_MINUTES` responde
   * `CLASSROOM_LEAD_TIME_WARNING`; con él en `true`, la misma petición se
   * acepta. Ausente y `false` son lo mismo.
   *
   * **No afecta al solapamiento ni a la duración**, que bloquean sin excepción:
   * confirmar es una decisión que el profesor puede tomar sobre sí mismo, y las
   * otras dos reglas no describen una molestia sino un imposible.
   */
  confirmarPocaAntelacion?: boolean;
}

/**
 * Antelación mínima por defecto, en minutos, con la que se publica un aula
 * (HU-212, `ARQUITECTURA.md` §4.4).
 *
 * **El servidor manda: este valor es el que trae `CLASS_MIN_LEAD_MINUTES` de
 * fábrica, pero el entorno puede fijar otro.** Está aquí para que el frontend
 * pueda redactar el aviso antes de haber hablado con la API; el número real de
 * cada respuesta viaja en `ClassroomLeadTimeWarningDetails.minimoMinutos`, y ese
 * es el que se muestra cuando existe.
 *
 * No baja de `ACCESS_WINDOW_MINUTES` (30) por construcción: por debajo de la
 * ventana de acceso de §4.1, el enlace se revelaría en el mismo instante en que
 * se publica la clase.
 */
export const CLASS_MIN_LEAD_MINUTES_DEFAULT = 60;

/**
 * Duración máxima por defecto de un aula, en minutos (HU-212).
 *
 * Mismo contrato que `CLASS_MIN_LEAD_MINUTES_DEFAULT`: el entorno puede fijar
 * otro con `CLASS_MAX_DURATION_MINUTES` y el servidor es la autoridad. El
 * frontend lo usa como `max` del control de duración (AC6) para que el error no
 * llegue a hacer falta, no para decidir si la petición es válida.
 */
export const CLASS_MAX_DURATION_MINUTES_DEFAULT = 240;

/**
 * `details` de `TEACHER_SCHEDULE_CONFLICT` (HU-212, AC5).
 *
 * Describe **el aula con la que se choca**, no la que se intentaba crear: es lo
 * que el mensaje necesita para decir «Ya tienes «Conversación cotidiana» el
 * martes 25 a las 6:00 p. m.» en vez de «hay un conflicto de horario».
 *
 * Solo lleva lo que ese mensaje usa. No es un `Classroom` recortado ni el
 * germen de uno: quien necesite el aula entera tiene su `id` para pedirla, y
 * `meetingLink` no viaja aquí por el mismo motivo que no viaja en un listado
 * (§4.8, regla 2). Que el aula sea del propio profesor no lo cambia.
 */
export interface TeacherScheduleConflictDetails {
  /** Id del aula que ocupa el horario. Sirve para enlazar a su detalle. */
  conflictoId: string;
  /** Título del aula que ocupa el horario. El mensaje lo entrecomilla. */
  conflictoTitulo: string;
  /** Inicio del aula que ocupa el horario, ISO 8601 en UTC (§4.7). */
  conflictoScheduledAt: string;
  /** Duración del aula que ocupa el horario. Con la anterior, el intervalo. */
  conflictoDurationMinutes: number;
}

/** `details` de `CLASSROOM_DURATION_INVALID` (HU-212, AC6). */
export interface ClassroomDurationInvalidDetails {
  /** Tope real que aplicó el servidor. Puede no ser el de fábrica. */
  maximoMinutos: number;
}

/**
 * `details` de `CLASSROOM_LEAD_TIME_WARNING` (HU-212, AC7).
 *
 * Van los dos números —el que hay y el que hacía falta— porque el diálogo
 * explica una consecuencia, y para explicarla tiene que poder decir cuánta
 * antelación falta.
 */
export interface ClassroomLeadTimeWarningDetails {
  /** Minutos que faltan hasta el inicio, calculados con el reloj del servidor. */
  minutosDeAntelacion: number;
  /** Antelación mínima que aplicó el servidor. Puede no ser la de fábrica. */
  minimoMinutos: number;
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
  /**
   * Solo aulas que incluyan este modo entre las suyas (HU-211, AC9). Combinable
   * con `level`, `desde` y `hasta`. **No viene puesto por defecto en ninguna
   * pantalla**: el catálogo destaca la coincidencia, no filtra por ella
   * (`ARQUITECTURA.md` §4.9, regla 1).
   */
  communicationMode?: CommunicationPreference;
  /**
   * Solo las aulas de quien pregunta (HU-208, AC5). Un filtro de
   * **presentación**, no de autorización: el catálogo entero sigue siendo
   * visible sin él.
   *
   * **No lleva un id, y eso es lo que lo hace seguro.** El `teacherId` con el
   * que se filtra sale del token, nunca del query — no hay forma de nombrar a
   * un tercero, así que no existe el `?teacherId=` que prohíbe
   * `ARQUITECTURA.md` §4.8 regla 3. Es un booleano justo por eso: estrecha el
   * alcance a quien ya está autenticado, nunca lo amplía.
   *
   * Va en el servidor y no en el cliente porque el catálogo pagina en el
   * servidor: filtrar la página ya recibida dejaría `total` contando aulas
   * ajenas y escondería las propias que cayeran en otra página.
   *
   * Para un `STUDENT` o un `ADMIN` la respuesta es una lista vacía —ninguna
   * aula tiene su id como `teacherId`—, que es la verdad y no un error.
   */
  mias?: boolean;
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
  /**
   * La reserva `CONFIRMED` de **quien pide**, si tiene alguna (HU-301, ajuste
   * post-cierre). `null` si no la tiene, o si quien pregunta no es un
   * estudiante — un `ADMIN`/`TEACHER` que llame a este listado nunca tiene
   * reserva propia. Sin esto, el catálogo no podía distinguir «disponible» de
   * «ya la reservaste», y ofrecía reservar otra vez sobre una clase propia.
   */
  myBookingStatus: BookingStatus | null;
  /**
   * El `id` de esa misma reserva (HU-303), para poder pedir
   * `POST /bookings/:id/cancelar`. `null` en los mismos casos que
   * `myBookingStatus`.
   */
  myBookingId: string | null;
  /**
   * Si esa reserva todavía se puede cancelar, ya decidido por el servidor
   * contra `CANCELLATION_WINDOW_MINUTES` (HU-303) — así el frontend pinta la
   * acción sin recalcular la ventana. `null` cuando `myBookingStatus` es
   * `null`; nunca decide el permiso, solo evita el redibujado: cancelar sigue
   * validándose en el servidor en el momento de la petición.
   */
  myBookingCancelable: boolean | null;
  /**
   * Estado de acceso al enlace, ya decidido por el servidor (HU-304, §4.1).
   * `sin-acceso` por defecto: solo `GET /classrooms/:id` y `GET /bookings/mias`
   * lo calculan de verdad — el catálogo y «mis aulas» no ofrecen entrar a la
   * clase desde la tarjeta, así que no hace falta la cuenta exacta ahí.
   */
  accessState: EstadoAccesoEnlace;
  /**
   * El instante en que se abrirá la ventana, ISO 8601 en UTC. Solo tiene
   * sentido cuando `accessState` es `aun-no` — en el resto de casos, `null`.
   * Viaja para que el frontend pinte la cuenta atrás sin reconstruir
   * `scheduledAt − ACCESS_WINDOW_MINUTES` con un valor que podría no coincidir
   * con el que configuró el servidor.
   */
  accessOpensAt: string | null;
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
 * Estado de la reserva de un estudiante en un aula. Especificado en
 * `docs/ARQUITECTURA.md` §7.2, tabla de `Booking`.
 *
 * **En el Sprint 2 nadie lo escribe y no tiene gemelo en `schema.prisma`**: el
 * modelo `Booking` no existe hasta el Sprint 3. Se declara aquí porque HU-204
 * necesita nombrar el tipo del campo `myBookingStatus`, y dejarlo sin tipar
 * obligaría a HU-301 a cambiar la forma del contrato en vez de solo empezar a
 * rellenarlo. Cuando llegue el modelo, este enum y el de Prisma se crean como
 * gemelos, con estos mismos miembros.
 *
 * `ATTENDED` y `NO_SHOW` los fija el profesor al marcar asistencia (HU-404).
 */
export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * La reserva de un estudiante en un aula (HU-301). Es historial: nunca se
 * borra, solo cambia de `status` (`ARQUITECTURA.md` §4.3).
 */
export interface Booking {
  id: string;
  studentId: string;
  classroomId: string;
  status: BookingStatus;
  /** Cuándo se canceló. `null` mientras esté vigente (HU-303). */
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Cuerpo de `POST /bookings` (HU-301). El estudiante sale del token. */
export interface CreateBookingInput {
  classroomId: string;
}

/** Respuesta de `POST /bookings`. Devuelve la reserva ya confirmada. */
export interface CreateBookingResponse {
  booking: Booking;
}

/**
 * Ventana de cancelación por defecto, en minutos (HU-303,
 * `ARQUITECTURA.md` §4.3). El servidor manda: el entorno puede fijar otro con
 * `CANCELLATION_WINDOW_MINUTES`, y ese es el que decide cada respuesta.
 */
export const CANCELLATION_WINDOW_MINUTES_DEFAULT = 60;

/** Respuesta de `POST /bookings/:id/cancelar` (HU-303). Devuelve la reserva ya cancelada. */
export interface CancelBookingResponse {
  booking: Booking;
}

/**
 * El aula completa que devuelve `GET /classrooms/:id` (HU-204).
 *
 * Es `ClassroomListItem` —el aula pública más el nombre de su profesor— y no
 * un tipo paralelo: el detalle enseña **lo mismo que la tarjeta y algo más**,
 * así que heredarlo garantiza que un campo añadido al listado no se olvide
 * aquí. `description` ya viaja en `Classroom` desde HU-201.
 *
 * Lo que el detalle añade son las dos cosas que **solo** se deciden mirando
 * quién pregunta:
 *
 *  - **`meetingLink`** (heredado de `Classroom`, opcional). Es el único
 *    endpoint que puede revelarlo (§4.8, regla 2: no viaja en ningún listado).
 *    Cuando no corresponde, **la clave se omite del JSON**: ni `null`, ni
 *    cifrada, ni escondida en otro campo.
 *  - **`myBookingStatus`**, abajo.
 */
export interface ClassroomDetail extends ClassroomListItem {
  /**
   * La reserva `CONFIRMED` de **quien pide**, si tiene alguna (HU-301). `null`
   * si no la tiene. HU-303 lo usa para abrir la ventana de acceso al enlace.
   *
   * Va en `null` y no omitido —al revés que `meetingLink`— a propósito: omitir
   * significa «no te corresponde saberlo», y aquí el hecho es «no hay reserva».
   * Son dos respuestas distintas y el frontend las trata distinto.
   */
  myBookingStatus: BookingStatus | null;
}

/**
 * Respuesta de `GET /classrooms/:id`.
 *
 * Envuelta en `{ classroom }` y no devuelta plana, como `CreateClassroomResponse`:
 * un objeto con nombre deja sitio para añadir datos hermanos —los estudiantes
 * inscritos de HU-304— sin cambiar la forma de lo que ya lee el frontend.
 */
export interface ClassroomDetailResponse {
  classroom: ClassroomDetail;
}

/**
 * Cuerpo de `PATCH /classrooms/:id` (HU-211, extendido por HU-202 con la
 * decisión D25 de `ARQUITECTURA.md`: mismo endpoint, mismo verbo, un solo DTO).
 *
 * Todo opcional: **omitir un campo lo deja intacto** (AC5), incluido
 * `communicationModes` — ya no es obligatorio como en HU-211, porque una
 * edición parcial del resto de campos no puede exigir declarar accesibilidad.
 */
export interface UpdateClassroomInput {
  title?: string;
  description?: string;
  level?: EnglishLevel;
  maxStudents?: number;
  /** Instante de inicio, ISO 8601. Debe ser futuro; lo comprueba el servidor. */
  scheduledAt?: string;
  durationMinutes?: number;
  /** Si cambia, se vuelve a cifrar (§4.1). */
  meetingLink?: string;
  communicationModes?: CommunicationPreference[];
  hasInterpreter?: boolean;
  hasLiveCaptions?: boolean;
  hasVisualMaterials?: boolean;
  meetingProvider?: MeetingProvider;
  /** Acuse de recibo del aviso de poca antelación (HU-212, AC7). */
  confirmarPocaAntelacion?: boolean;
}

/**
 * `details` de `CLASSROOM_HAS_BOOKINGS` (HU-306, D30).
 *
 * El número de reservas vivas es el mismo `currentBookings` del aula: no hay
 * un segundo contador. Viaja aquí, y no solo en el propio aula, porque el
 * mensaje de error necesita explicar la consecuencia sin que el frontend
 * tenga que ir a buscarlo a otra respuesta.
 */
export interface ClassroomHasBookingsDetails {
  /** Reservas `CONFIRMED` vigentes que el cambio dejaría sin clase. */
  reservasActivas: number;
}

/** Respuesta de `PATCH /classrooms/:id`. Devuelve el aula ya actualizada. */
export interface UpdateClassroomResponse {
  classroom: Classroom;
}

/** Respuesta de `POST /classrooms/:id/cancel` (HU-202). Devuelve el aula ya cancelada. */
export interface CancelClassroomResponse {
  classroom: Classroom;
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

/**
 * Query de `GET /admin/classrooms` (HU-210). Solo `ADMIN`. Sin ningún filtro
 * puesto, devuelve **todas** las aulas de **todos** los profesores: publicadas,
 * canceladas y pasadas (§4.8). No es el catálogo con otro filtro: el catálogo
 * (`ListClassroomsQuery`) solo enseña `PUBLISHED` y futuras.
 */
export interface AdminClassroomsQuery {
  teacherId?: string;
  status?: ClassroomStatus;
  /** ISO 8601. Cota inferior de `scheduledAt`, combinable con `hasta`. */
  desde?: string;
  /** ISO 8601. Cota superior de `scheduledAt`, combinable con `desde`. */
  hasta?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Respuesta de `GET /admin/classrooms`. Mismo formato de paginación que el
 * catálogo y «Mis aulas» (T6): un solo contrato de listado en toda la API.
 *
 * Reutiliza `ClassroomListItem` —no un tipo paralelo— porque la fila de
 * supervisión enseña lo mismo que la tarjeta del catálogo: el aula pública más
 * el nombre del profesor. `meetingLink` no viaja: ni `Classroom` ni
 * `ClassroomListItem` lo incluyen salvo que alguien lo añada explícitamente, y
 * este endpoint no lo hace (decisión 2 de la HU, AC4).
 */
export interface AdminClassroomsResponse {
  items: ClassroomListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Query de `GET /bookings/mias` (HU-302). Misma forma que `MisAulasQuery`: no
 * declara `studentId`, así que el alcance sale del token (§4.8, regla 3), y
 * comparte el mismo filtro temporal disjunto (D24).
 */
export interface MisReservasQuery {
  /** Por defecto, `todas`: la primera vez que llega, quiere ver todo lo suyo. */
  estado?: EstadoTemporalAula;
  page?: number;
  pageSize?: number;
}

/**
 * Respuesta de `GET /bookings/mias`. Reutiliza `ClassroomListItem` —no un tipo
 * paralelo—: el estudiante ve el aula reservada con el nombre de su profesor y
 * su propio `myBookingStatus`, igual que en el catálogo. `meetingLink` no
 * viaja, por la misma regla que en cualquier otro listado.
 */
export interface MisReservasResponse {
  items: ClassroomListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Un inscrito en un aula, tal y como lo ve el profesor dueño (HU-305).
 *
 * **Deliberadamente sin `email`.** El profesor no necesita escribirle a nadie
 * por fuera de la plataforma. `bookingId` sí viaja (HU-403): es lo que
 * identifica QUÉ reserva marcar al pasar asistencia.
 */
export interface InscritoAula {
  bookingId: string;
  firstName: string;
  lastName: string;
  hearingLossLevel: HearingLossLevel | null;
  communicationPreference: CommunicationPreference | null;
  bookingStatus: BookingStatus;
}

/** Los dos únicos valores que un profesor puede fijar al marcar asistencia (HU-403). */
export type AttendanceStatus = BookingStatus.ATTENDED | BookingStatus.NO_SHOW;

/** Cuerpo de `POST /classrooms/:id/asistencia` (HU-403). El aula sale de la ruta. */
export interface MarkAttendanceInput {
  bookingId: string;
  status: AttendanceStatus;
}

/** Respuesta de `POST /classrooms/:id/asistencia`. Devuelve el inscrito ya actualizado. */
export interface MarkAttendanceResponse {
  inscrito: InscritoAula;
}

/** Respuesta de `GET /classrooms/:id/inscritos` (HU-305). Separado por estado, no una lista con filtro. */
export interface InscritosAulaResponse {
  confirmados: InscritoAula[];
  cancelados: InscritoAula[];
}

/**
 * Respuesta de `GET /admin/teachers`: todos los profesores de la academia, sin
 * filtrar por estado. Sirve al selector del filtro de supervisión (HU-210) y
 * es un superconjunto de `PendingTeachersResponse`, que solo trae los
 * `PENDING`.
 */
export interface TeachersResponse {
  teachers: User[];
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
  /**
   * No hay ningún aula con ese identificador (HU-204).
   *
   * Lo emite también un `id` con forma inválida: desde fuera, «ese uuid no
   * existe» y «eso no es un uuid» son el mismo hecho —ahí no hay nada—, y
   * distinguirlos solo serviría para confirmarle a quien sondea que acertó con
   * el formato. Es el mismo criterio que `USER_NOT_FOUND` en `/admin/teachers`.
   *
   * **Un aula `CANCELLED` NO lo emite:** existe, se abre y muestra su estado
   * (decisión de auditoría 3 de HU-204). Un 404 ahí parecería un fallo de la
   * plataforma justo cuando el usuario necesita entender qué pasó.
   */
  CLASSROOM_NOT_FOUND: 'CLASSROOM_NOT_FOUND',
  /**
   * Quien pide `PATCH /classrooms/:id` no es el profesor dueño del aula
   * (HU-211). Es 403 y no 404: el aula existe y quien pregunta lo sabe —la
   * vio en el catálogo—, lo que falta es el permiso, no el dato.
   */
  CLASSROOM_FORBIDDEN: 'CLASSROOM_FORBIDDEN',
  /**
   * El aula que se quiere publicar o editar se solapa con otra `PUBLISHED` del
   * mismo profesor (HU-212, `ARQUITECTURA.md` §4.4). Es 409: no es que el
   * cuerpo esté mal formado, es que el horario ya está ocupado.
   *
   * **Bloquea y no se puede confirmar**, al revés que
   * `CLASSROOM_LEAD_TIME_WARNING`: publicar con poca antelación solo perjudica
   * al propio profesor, pero estar en dos videollamadas a la vez es imposible.
   *
   * Lleva `details` con la forma de `TeacherScheduleConflictDetails`: el aula
   * con la que se choca, para que el mensaje pueda nombrarla (AC5). Un error que
   * solo dice «hay conflicto» obliga a buscar el choque a mano.
   *
   * Las canceladas no lo emiten: un aula `CANCELLED` no ocupa a nadie.
   */
  TEACHER_SCHEDULE_CONFLICT: 'TEACHER_SCHEDULE_CONFLICT',
  /**
   * `durationMinutes` supera `CLASS_MAX_DURATION_MINUTES` (HU-212). Lleva
   * `details` con la forma de `ClassroomDurationInvalidDetails`.
   *
   * Es un código propio y no un `VALIDATION_ERROR` porque el tope **sale del
   * entorno**, no del DTO: el formulario no puede saberlo de antemano con
   * certeza, así que necesita que la respuesta le diga cuál era el máximo real.
   */
  CLASSROOM_DURATION_INVALID: 'CLASSROOM_DURATION_INVALID',
  /**
   * El aula empieza antes de `CLASS_MIN_LEAD_MINUTES` (HU-212, AC7).
   *
   * **Es un aviso confirmable, no un bloqueo**, y por eso es un código propio y
   * no un `VALIDATION_ERROR`: el frontend ramifica por el código —abre el
   * diálogo con `Publicar de todas formas` / `Cambiar la hora`— y reenvía la
   * misma petición con `confirmarPocaAntelacion: true`, que la acepta. Decidirlo
   * mirando dentro de `details` habría roto la regla de `contrato-api.md` §3.
   *
   * La consecuencia que el diálogo tiene que explicar está en el propio hecho:
   * por debajo de la ventana de acceso de §4.1 el enlace se revela en el mismo
   * instante en que se publica la clase, y el recordatorio de 24 h de §4.6 no
   * llega nunca.
   *
   * Lleva `details` con la forma de `ClassroomLeadTimeWarningDetails`.
   */
  CLASSROOM_LEAD_TIME_WARNING: 'CLASSROOM_LEAD_TIME_WARNING',
  /**
   * Se intentó editar o cancelar un aula que ya empezó (`now ≥ scheduledAt`) o
   * que ya está `CANCELLED` (HU-202, AC3). Es 409: el aula existe, lo que no
   * existe ya es la ventana para actuar sobre ella.
   */
  CLASSROOM_NOT_EDITABLE: 'CLASSROOM_NOT_EDITABLE',
  /**
   * Se intentó mover `scheduledAt` o `durationMinutes` de un aula con reservas
   * `CONFIRMED` vivas (HU-306, decisión D30). Es 409: el aula existe y sigue
   * siendo editable, pero esos dos campos concretos están bloqueados —cada
   * estudiante ya reservado tiene su propia agenda, y reprogramar es un
   * problema de producto mayor que un `UPDATE` (ver la decisión completa en la
   * HU). El resto de campos del mismo `PATCH` sigue aceptándose.
   *
   * Lleva `details` con la forma de `ClassroomHasBookingsDetails`.
   */
  CLASSROOM_HAS_BOOKINGS: 'CLASSROOM_HAS_BOOKINGS',
  /**
   * El aula ya tiene tantas reservas `CONFIRMED` como `maxStudents` (HU-301,
   * AC1). Es 409: el cuerpo es válido, lo que falta es cupo. Se decide dentro
   * de la transacción de `ARQUITECTURA.md` §4.2 — comprobarlo antes de bloquear
   * la fila del aula dejaría la carrera abierta que esta HU existe para cerrar.
   */
  CLASSROOM_FULL: 'CLASSROOM_FULL',
  /**
   * El aula no admite reservas: no está `PUBLISHED`, está `CANCELLED`, o ya
   * empezó (`now ≥ scheduledAt`) (HU-301, T4).
   */
  CLASSROOM_NOT_BOOKABLE: 'CLASSROOM_NOT_BOOKABLE',
  /**
   * El estudiante ya tiene una reserva `CONFIRMED` en esa aula (HU-301, AC2).
   * Es 409 y no un duplicado silencioso: reservar dos veces no da dos cupos.
   */
  BOOKING_ALREADY_EXISTS: 'BOOKING_ALREADY_EXISTS',
  /**
   * La nueva reserva se solapa en horario con otra `CONFIRMED` del mismo
   * estudiante (HU-301, AC2; `ARQUITECTURA.md` §4.4). El intervalo es cerrado
   * por la izquierda y abierto por la derecha: dos clases consecutivas no chocan.
   */
  BOOKING_OVERLAP: 'BOOKING_OVERLAP',
  /**
   * La reserva no existe, no es del que pregunta, o ya no está `CONFIRMED`
   * (HU-303, AC4/AC5). Es 404 en los tres casos y no un 403 o un código
   * propio para "ya cancelada": no confirma que la reserva exista ante quien
   * no es su dueño, y una cancelación repetida no necesita distinguirse de
   * "no encontrada" para que el frontend actúe distinto.
   */
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  /**
   * Se intentó cancelar a menos de `CANCELLATION_WINDOW_MINUTES` del inicio
   * (HU-303, AC3). Es 409: la reserva existe, lo que ya no existe es la
   * ventana para cancelarla.
   */
  CANCELLATION_WINDOW_CLOSED: 'CANCELLATION_WINDOW_CLOSED',
  /**
   * Se intentó marcar asistencia antes de que la clase terminara (HU-403,
   * D33). Es 409: el aula existe, lo que falta es que pase el tiempo.
   */
  CLASS_NOT_FINISHED: 'CLASS_NOT_FINISHED',
  /**
   * El `bookingId` no existe, no es de esta aula, o su reserva está
   * `CANCELLED` (HU-403, T4): quien canceló no faltó, así que no es un
   * destino válido de asistencia. Es 404 en los tres casos: no confirma cuál
   * de ellos ocurrió.
   */
  BOOKING_NOT_IN_CLASSROOM: 'BOOKING_NOT_IN_CLASSROOM',
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

/**
 * `coincideConLaPreferencia()` (HU-211) vive en su propio archivo por el mismo
 * motivo que `derivarEstadoAula()`: es lógica de negocio compartida con sus
 * propios tests.
 */
export * from './accesibilidad-aula';

/**
 * `EstadoAccesoEnlace` (HU-304) vive en su propio archivo por el mismo motivo
 * que los anteriores: es parte del contrato, no lógica de negocio derivada.
 */
export * from './acceso-enlace';
