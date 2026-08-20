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
`INSUFFICIENT_ROLE`, `INVALID_REFRESH_TOKEN`, `PROFILE_FORBIDDEN`, `USER_NOT_FOUND`,
`INVALID_STATUS_TRANSITION`, `TOO_MANY_REQUESTS`, `DATABASE_UNAVAILABLE`, `INTERNAL_ERROR`. Los
del dominio de reservas están en `reglas-reservas.md` §7.

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

| Método | Ruta             | Entrada              | `data`                         | Cookie                    |
| ------ | ---------------- | -------------------- | ------------------------------ | ------------------------- |
| POST   | `/auth/register` | `RegisterInput`      | `{ user }`                     | —                         |
| POST   | `/auth/login`    | `LoginInput`         | `AuthSession`                  | **set** `refresh_token`   |
| POST   | `/auth/refresh`  | — (cookie)           | `AuthSession`                  | **rota** `refresh_token`  |
| POST   | `/auth/logout`   | — (cookie)           | `{ loggedOut: true }`          | **borra** `refresh_token` |
| GET    | `/users/me`      | — (token)            | `{ user }`                     | —                         |
| PATCH  | `/users/me`      | `UpdateProfileInput` | `{ user }`                     | —                         |
| GET    | `/health`        | —                    | `{ status, uptime, database }` | —                         |

Back-office, todos con `@Roles(UserRole.ADMIN)` en la clase del controlador (HU-104):

| Método | Ruta                          | Entrada   | `data`                 |
| ------ | ----------------------------- | --------- | ---------------------- |
| GET    | `/admin/teachers/pending`     | — (token) | `{ teachers: User[] }` |
| POST   | `/admin/teachers/:id/approve` | — (ruta)  | `{ user }`             |
| POST   | `/admin/teachers/:id/reject`  | — (ruta)  | `{ user }`             |

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
`TEACHER_APPROVAL_REQUIRED`.

Pendientes de introducir (ver `docs/ARQUITECTURA.md` §6.4): `MEETING_LINK_KEY` (obligatoria),
`ACCESS_WINDOW_MINUTES` (30), `CANCELLATION_WINDOW_MINUTES` (60).
