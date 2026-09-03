# Contrato de API y convenciones de datos

## 1. `@academia/types` es la única fuente de verdad

El contrato back ↔ front no vive en la documentación ni en la cabeza de nadie: vive compilado en
`packages/types/src/index.ts`, y las dos apps lo importan.

Reglas del paquete:

- **Agnóstico de framework.** Ni decoradores de NestJS, ni tipos de React. Solo el contrato de
  datos que cruza la red.
- **Nunca expone datos sensibles.** El tipo `User` es deliberadamente un subconjunto del modelo de
  Prisma, **sin `password`**, para que sea imposible serializar el hash por accidente. Si añades un
  campo sensible al modelo, **no** lo añadas aquí.
- **Los enums son `enum` de TypeScript, no `const enum`.** Emiten un objeto en runtime: el backend
  los valida contra la BD y el frontend los itera para pintar selectores.
- **Fechas como cadenas ISO 8601.** Es lo que sobrevive a `JSON`.
- Los enums de aquí y los de `schema.prisma` comparten miembros **a propósito**. Se cambian juntos,
  en el mismo commit.

Tras tocar el paquete: `npm run build:types`. Las apps consumen `dist/`, no el fuente.

## 2. El envelope

Un interceptor global envuelve **toda** respuesta:

```jsonc
{ "success": true,  "data": { … },                              "timestamp": "…" }
{ "success": false, "error": { "code", "message", "details"? }, "timestamp": "…" }
```

Está modelado como unión discriminada por `success`, así que TypeScript estrecha solo: si
`success === true`, `data` está garantizado.

No devuelvas nunca un objeto crudo desde un controller. No inventes un envelope alternativo para un
endpoint concreto.

## 3. Errores

`code` sale del catálogo `ApiErrorCode` y es **estable**: es API pública. El frontend decide qué
mensaje mostrar a partir del código, **nunca** parseando `message`.

- Renombrar un código es un cambio incompatible. Se añaden códigos, no se mutan.
- Los errores de validación llevan `details.fields[]` con `{ field, message }` — es exactamente lo
  que el formulario necesita para pintar el error bajo cada input.
- Los mensajes de credenciales son **deliberadamente genéricos** (`INVALID_CREDENTIALS`): no
  revelan si el email existe.

Códigos ya existentes: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`,
`ACCOUNT_SUSPENDED`, `ACCOUNT_PENDING`, `ACCOUNT_REJECTED`, `UNAUTHENTICATED`,
`INSUFFICIENT_ROLE`, `INVALID_REFRESH_TOKEN`, `PASSWORD_RESET_TOKEN_INVALID`,
`PASSWORD_RESET_TOKEN_EXPIRED`, `PROFILE_FORBIDDEN`, `USER_NOT_FOUND`,
`CLASSROOM_NOT_FOUND`, `CLASSROOM_FORBIDDEN`, `TEACHER_SCHEDULE_CONFLICT`,
`CLASSROOM_DURATION_INVALID`, `CLASSROOM_LEAD_TIME_WARNING`, `INVALID_STATUS_TRANSITION`,
`TOO_MANY_REQUESTS`, `DATABASE_UNAVAILABLE`, `INTERNAL_ERROR`. Los del dominio de reservas están en
`reglas-reservas.md` §7.

**Un cuarto par que tampoco es intercambiable (HU-212):** los tres códigos de coherencia temporal
del aula tienen `details` tipados en `@academia/types` y **no todos bloquean igual**.
`TEACHER_SCHEDULE_CONFLICT` (409) y `CLASSROOM_DURATION_INVALID` (400) bloquean sin excepción;
`CLASSROOM_LEAD_TIME_WARNING` (409) es un **aviso confirmable**: la misma petición reenviada con
`confirmarPocaAntelacion: true` en el cuerpo se acepta. Ese flag es el único campo de
`CreateClassroomInput` que no describe el aula —no se persiste ni vuelve en `Classroom`—: es el
acuse de recibo de un aviso. Son códigos propios y no `VALIDATION_ERROR` porque el frontend ramifica
por el código (§3, arriba) y porque los dos umbrales salen del entorno, así que la respuesta tiene
que decir cuál era el número real.

Tres que se confunden con facilidad y no son intercambiables:

- `UNAUTHENTICATED` (401) — no hay sesión válida. Entrar lo arregla.
- `INSUFFICIENT_ROLE` (403) — hay sesión, pero el rol no alcanza. Entrar no arregla nada.
- `ACCOUNT_*` (403) — las credenciales eran correctas; lo que bloquea es el estado de la cuenta.

`PROFILE_FORBIDDEN` está **reservado y sin emisor**: `/users/me` deriva el id del token, así que no
existe petición capaz de provocarlo. Lo usará `AdminModule` cuando haya edición de perfiles
ajenos. No inventes una ruta para justificarlo.

## 4. DTOs

- Uno de entrada por operación (`CreateClassroomDto`, `CreateBookingDto`), **derivado del tipo
  compartido**: el DTO implementa la interfaz de `@academia/types`, no la reinventa.
- Validación con `class-validator` en el DTO, no en el service. El service asume entrada válida y
  se ocupa de reglas de negocio.
- Salida: se mapea explícitamente al tipo compartido (ver `users/user.mapper.ts`). **Nunca**
  devuelvas un objeto de Prisma directamente — así es como se filtra un `password`.

## 5. Convenciones del esquema de Prisma

| Convención                  | Regla                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| Clave primaria              | `String @id @default(uuid()) @db.Uuid`                                        |
| Nombre de tabla             | Plural, snake_case, vía `@@map("bookings")`                                   |
| Nombre de columna           | snake_case vía `@map("student_id")`                                           |
| Auditoría                   | `createdAt @default(now())` + `updatedAt @updatedAt` en todo lo que se audita |
| Fechas con hora del dominio | `timestamptz`, siempre UTC                                                    |
| Enums                       | Mismos miembros que su gemelo en `@academia/types`                            |
| Comentarios                 | `///` sobre cada modelo y sobre todo campo cuyo porqué no sea obvio           |

El esquema del repo está **densamente comentado a propósito**: explica por qué existe cada
decisión, no qué hace cada campo. Mantén ese estándar; es lo que evita que la próxima persona
deshaga una decisión sin saberlo.

**Migraciones:** se generan con `npm run db:migrate` y se versionan. Una migración ya aplicada
**no se edita a mano**: se corrige con otra encima. Los índices que Prisma no modela (como el único
parcial de `bookings`) van en SQL dentro de la migración, con un comentario que explique por qué.

## 6. Endpoints existentes

| Método | Ruta                    | Entrada               | `data`                | Cookie                    |
| ------ | ----------------------- | --------------------- | --------------------- | ------------------------- |
| POST   | `/auth/register`        | `RegisterInput`       | `{ user }`            | —                         |
| POST   | `/auth/login`           | `LoginInput`          | `AuthSession`         | **set** `refresh_token`   |
| POST   | `/auth/refresh`         | — (cookie)            | `AuthSession`         | **rota** `refresh_token`  |
| POST   | `/auth/logout`          | — (cookie)            | `{ loggedOut: true }` | **borra** `refresh_token` |
| POST   | `/auth/forgot-password` | `ForgotPasswordInput` | `{ requested: true }` | —                         |
| POST   | `/auth/reset-password`  | `ResetPasswordInput`  | `{ reset: true }`     | —                         |

**`/auth/forgot-password` responde igual exista o no la cuenta** (HU-410): mismo
status, mismo cuerpo `{ requested: true }` — no enumera emails. Solo si la cuenta
está `ACTIVE` se emite un `PasswordResetToken` (hash SHA-256 en BD, un solo uso,
`PASSWORD_RESET_EXPIRY_MINUTES`) y sale el correo `PASSWORD_RESET` con el enlace
`FRONTEND_URL/nueva-contrasena?token=…`. **`/auth/reset-password`** valida el
token en una transacción (`PASSWORD_RESET_TOKEN_INVALID` / `_EXPIRED`), reescribe
la contraseña (regla del registro, `VALIDATION_ERROR` si no) y **revoca todas las
sesiones del usuario**. Ambos bajo `AuthThrottlerGuard`.
| GET | `/users/me` | — (token) | `{ user }` | — |
| PATCH | `/users/me` | `UpdateProfileInput` | `{ user }` | — |
| GET | `/health` | — | `{ status, uptime, database }` | — |

Back-office, todos con `@Roles(UserRole.ADMIN)` en la clase del controlador (HU-104):

| Método | Ruta                          | Entrada   | `data`                 |
| ------ | ----------------------------- | --------- | ---------------------- |
| GET    | `/admin/teachers/pending`     | — (token) | `{ teachers: User[] }` |
| POST   | `/admin/teachers/:id/approve` | — (ruta)  | `{ user }`             |
| POST   | `/admin/teachers/:id/reject`  | — (ruta)  | `{ user }`             |

Aulas (HU-201, HU-203, HU-207, HU-204, HU-211, HU-208, HU-202):

| Método | Ruta                     | Entrada                | `data`                             | Rol                |
| ------ | ------------------------ | ---------------------- | ---------------------------------- | ------------------ |
| POST   | `/classrooms`            | `CreateClassroomInput` | `{ classroom }`                    | `TEACHER` `ACTIVE` |
| GET    | `/classrooms`            | `ListClassroomsQuery`  | `{ items, total, page, pageSize }` | Cualquier sesión   |
| GET    | `/classrooms/mias`       | `MisAulasQuery`        | `{ items, total, page, pageSize }` | `TEACHER`          |
| GET    | `/classrooms/:id`        | — (ruta)               | `{ classroom: ClassroomDetail }`   | Cualquier sesión   |
| PATCH  | `/classrooms/:id`        | `UpdateClassroomInput` | `{ classroom }`                    | `TEACHER` (dueño)  |
| POST   | `/classrooms/:id/cancel` | — (ruta)               | `{ classroom }`                    | `TEACHER` (dueño)  |

**`PATCH /classrooms/:id` nació acotado a los 5 campos de accesibilidad (HU-211) y HU-202 lo
extendió** con el resto del aula (título, horario, cupo, enlace) — decisión D25 de
`ARQUITECTURA.md`: un solo endpoint, no uno paralelo. Todo opcional; omitir un campo lo deja
intacto. Solo el profesor dueño puede llamarlo; cualquier otro recibe `CLASSROOM_FORBIDDEN` (403).
Un id inexistente responde `CLASSROOM_NOT_FOUND`. Editar o cancelar un aula que ya empezó
(`now ≥ scheduledAt`) o ya `CANCELLED` responde `CLASSROOM_NOT_EDITABLE` (409) en los dos endpoints.

**`GET /classrooms?mias=true` acota el catálogo al profesor que pregunta** (HU-208, D27). Es la
única excepción a «ningún parámetro toca el alcance» de §4.8 regla 3, y lo es porque no la rompe:
**es un booleano sin id**, el `teacherId` sale de `@CurrentUser()`, y **estrecha** un catálogo que
quien pide ya podía ver entero — no puede revelar nada que la petición sin el parámetro no
devuelva. Un `STUDENT` o un `ADMIN` que lo mande recibe una lista vacía, que es la verdad y no un
error: no hace falta un 403.

La prueba para cualquier parámetro nuevo que quiera filtrar por alguien: **si lleva un id, o si con
él se ve algo que sin él no se veía, está prohibido**. Y no se resuelve en el frontend: este
listado pagina en el servidor, así que filtrar la página ya enviada dejaría `total` contando filas
ajenas. `?mias=` viaja como texto, así que el DTO lo traduce con `@Transform` y no con `@Type(() =>
Boolean)` — `Boolean('false')` es `true`.

**`/classrooms/mias` va declarada ANTES que `/classrooms/:id`**: Nest resuelve por orden de
registro, y un `:id` por encima se tragaría `mias` como si fuera un identificador. `:id` es la ruta
más genérica del controlador, así que va la última y cualquier `@Get('<literal>')` nuevo tiene que
quedar por encima. `classrooms.controller.spec.ts` vigila ese orden.

**`GET /classrooms/:id` es el ÚNICO endpoint que puede revelar `meetingLink`** (§4.8 regla 2: no
viaja en ningún listado). Quién lo ve se decide en **un solo método privado del servicio**,
`revelarElEnlace()`: hoy «el que pide es el profesor dueño», y **HU-303 extiende ese método**, no el
endpoint —le añade la rama del estudiante con reserva `CONFIRMED` dentro de los 30 minutos previos—.
Cuando no corresponde, la clave **se añade condicionalmente al objeto, no se asigna a `undefined`**:
§4.1 pide que el campo no viaje, no que viaje vacío. **Un aula `CANCELLED` no revela el enlace a
nadie, ni al dueño.**

Un aula `CANCELLED` **sí se devuelve**, con su estado: no aparece en el catálogo, pero quien tenga
el enlace de la página tiene que poder entender qué pasó. El 404 `CLASSROOM_NOT_FOUND` es solo para
el id inexistente, y también para el malformado —un `ParseUUIDPipe` con `exceptionFactory`, igual que
`idDeProfesor` en `AdminController`—. `ClassroomDetail.myBookingStatus` llega **`null` en todo el
Sprint 2** (`Booking` no existe); lo rellena HU-301. Va en `null` y no omitido, al revés que el
enlace: omitir significa «no te corresponde saberlo», `null` significa «no hay reserva».

**El alcance sale del token, y por eso `MisAulasQuery` no declara `teacherId`.** No existe
`?teacherId=`; el `whitelist` del ValidationPipe rechaza el campo con `VALIDATION_ERROR` si alguien
lo intenta (§4.8, regla 3). Su filtro `estado` (`EstadoTemporalAula`) define **tres grupos disjuntos
y exhaustivos** —`canceladas` es por estado y gana sobre la fecha, así que una cancelada del mes que
viene no cuenta como próxima— y `todas` es su unión, servida como **dos listas concatenadas**:
próximas ascendente y después el historial descendente. Los `items` son `Classroom`, sin el nombre
del profesor: es quien pregunta. **`meetingLink` no viaja tampoco aquí**, ni al dueño.

**`@Roles` va en el MÉTODO, no en la clase** —al revés que en `AdminController`— porque el listado
y el detalle (HU-203, HU-204) los ve cualquier usuario autenticado: un `@Roles(TEACHER)` de clase
cerraría el catálogo a los estudiantes. **El `teacherId` sale del token** y no se declara en el DTO;
mandarlo en el cuerpo lo rechaza el `whitelist` del ValidationPipe con `VALIDATION_ERROR`, igual que
en `/users/me`. **El estado `ACTIVE` del profesor se comprueba contra la BD, no contra el token**: el
access token vive 15 minutos, así que un profesor suspendido hace cinco seguiría publicando clases.
Los tres estados devuelven su código propio (`ACCOUNT_PENDING`, `ACCOUNT_REJECTED`,
`ACCOUNT_SUSPENDED`); HU-201 **no añadió códigos nuevos**. La respuesta de crear y la de los dos
listados **nunca incluyen `meetingLink`**: revelarlo es competencia del detalle (arriba) y de
HU-303.

**Dos rutas, no un `PATCH` con el estado en el cuerpo.** Un cuerpo con `status` permitiría pedir
cualquier `UserStatus` —`SUSPENDED` incluido— y obligaría al servidor a defenderse de estados que
esa pantalla nunca debe poder pedir. Con una ruta por desenlace, las únicas transiciones
alcanzables son las dos que §4.5 declara válidas. El `:id` pasa por un `ParseUUIDPipe` cuyo fallo
se traduce a `USER_NOT_FOUND`: sin él, un id malformado llega a una columna `@db.Uuid` y responde 500.

**`/users/me` y el id del token.** Las rutas del perfil propio son `/me` y **no existe
`/users/:id`**: el id sale siempre de `@CurrentUser()`. No es una comodidad, es la autorización —
sin forma de nombrar a un tercero, no hay perfil ajeno que proteger. `UpdateProfileInput` solo
declara los campos editables, así que `email`, `role` e `id` en el cuerpo los rechaza el
`whitelist` del ValidationPipe con `VALIDATION_ERROR`. Si algún día hace falta editar el perfil de
otra persona, va en `AdminModule` con su propia autorización de rol, no aflojando esto.

Al añadir un endpoint, actualiza `AUTH_FLOW.md` si es de `/auth`, y `docs/ARQUITECTURA.md` si
introduce una decisión nueva.

## 7. Variables de entorno

Se declaran **solo** en `config/env.schema.ts` (Zod), con comentario de por qué existen, y se
replican en `.env.example`. Con `.default(...)` son opcionales; sin él, obligatorias y la app no
arranca sin ellas.

Ya definidas: `NODE_ENV`, `PORT`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `REFRESH_TOKEN_TTL_DAYS`,
`AUTH_THROTTLE_TTL`, `AUTH_THROTTLE_LIMIT`, `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGIN`,
`TEACHER_APPROVAL_REQUIRED`, **`MEETING_LINK_KEY`** (obligatoria, HU-201),
`PASSWORD_RESET_EXPIRY_MINUTES` (30, HU-410).

`MEETING_LINK_KEY` se valida como **64 caracteres hexadecimales = 32 bytes exactos**, no como "una
cadena larga": AES-256 necesita esa longitud, y aceptar cualquier otra obligaría a derivar o rellenar
la clave, escondiendo un error de configuración detrás de un cifrado más débil de lo que su nombre
promete. Se genera con `openssl rand -hex 32`. **Cambiarla deja ilegibles los enlaces ya guardados**:
no hay rotación de claves en Fase 1 (el prefijo `v1.` del texto cifrado es el gancho para añadirla).

`CLASS_MIN_LEAD_MINUTES` (60) y `CLASS_MAX_DURATION_MINUTES` (240) están **en el esquema desde
HU-212**. La primera no admite un valor por debajo de la ventana de acceso (30) y la app se niega a
arrancar si se lo dan: por debajo, el enlace se revelaría al publicar la clase.

Pendientes de introducir (ver `docs/ARQUITECTURA.md` §6.4): `ACCESS_WINDOW_MINUTES` (30) y
`CANCELLATION_WINDOW_MINUTES` (60).

`@academia/types` exporta `CLASS_MIN_LEAD_MINUTES_DEFAULT` y `CLASS_MAX_DURATION_MINUTES_DEFAULT`
con esos mismos valores. **No son la configuración, son el valor de fábrica**: existen para que el
formulario pueda poner un `max` y redactar el aviso antes de hablar con la API. El servidor es la
autoridad y devuelve su número real dentro de `details`. Si alguna vez divergen, manda el `details`.
