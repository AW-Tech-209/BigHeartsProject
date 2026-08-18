# BigHearts — Arquitectura de Sistema

|                     |                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**          | Fuente de verdad canónica. Se edita aquí.                                                                                                             |
| **Responde**        | El **cómo**. El **qué** y el **por qué** viven en [`DEFINICION_PROYECTO.md`](./DEFINICION_PROYECTO.md).                                               |
| **Última revisión** | 2026-08-14 (auditoría contra el repo)                                                                                                                 |
| **Origen**          | Portado desde `Arquitectura_Academia_Hipoacusicos.docx` (v1.0, mayo 2025). Ese `.docx` queda como **snapshot histórico** y no vuelve a sincronizarse. |

> **Aviso.** El `.docx` de origen precede al código en más de un año y estaba desalineado en varios
> puntos importantes (ORM, despliegue, patrón de capas, modelo de datos). Todo lo corregido está
> marcado con `> **Nota de auditoría**` y resumido en [§14](#14-registro-de-la-auditoría-2026-08-14).

## Cómo leer este documento

- **§1–§10 son el cuerpo vivo**: lo que hay que saber para escribir código hoy.
- **§13 son anexos de referencia**: decisiones ya tomadas cuyo razonamiento se conserva por si hay
  que revisitarlas. No hace falta leerlos para implementar una HU.
- Este documento **no repite** lo que ya está bien explicado en otro sitio. Cuando algo vive en
  `README.md`, `AUTH_FLOW.md`, `DEPLOYMENT.md` o en un skill, aquí solo se referencia.

---

## 1. Panorama del sistema

Tres capas, un solo despliegue de backend:

```
┌─────────────────────────────────────────────────────────┐
│  CLIENTE — SPA React 19 + Vite + Tailwind v4            │
│  Vercel · feature-based · React Query + Zustand         │
└───────────────────────┬─────────────────────────────────┘
                        │  HTTPS · REST/JSON · ApiResponse<T>
                        │  Bearer access token + cookie httpOnly de refresh
┌───────────────────────┴─────────────────────────────────┐
│  BACKEND — NestJS 11, monolito modular                  │
│  Render · auth │ users │ classrooms │ bookings          │
│              │ sessions │ notifications │ admin         │
└───────────────────────┬─────────────────────────────────┘
                        │  Prisma 6
┌───────────────────────┴─────────────────────────────────┐
│  DATOS — PostgreSQL 17                                  │
│  Supabase en staging/prod · Docker en desarrollo        │
└─────────────────────────────────────────────────────────┘
```

El contrato entre las dos apps no es informal: vive compilado en **`@academia/types`**, y las dos
lo importan. Ver [§5.3](#53-el-paquete-de-tipos-compartidos).

---

## 2. Decisiones técnicas clave

Cada decisión con su alternativa descartada y su motivo. El análisis largo de las que lo tuvieron
está en los anexos ([§13](#13-anexos-de-referencia)).

| #   | Decisión                                                              | Alternativa descartada                         | Motivo                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Monolito modular** con NestJS                                       | Microservicios                                 | Equipo de dos personas. Módulos bien encapsulados permiten extraer uno más adelante si la carga lo pide. Ver [§13.1](#131-monolito-modular-vs-microservicios).                                                  |
| D2  | **Monorepo npm workspaces** (`apps/*` + `packages/*`)                 | Dos repos separados                            | Un solo lockfile, un solo CI, y el contrato de tipos enlazado por symlink en vez de publicado.                                                                                                                  |
| D3  | **PostgreSQL**                                                        | MongoDB u otro documental                      | Relaciones densas (usuario ↔ aula ↔ reserva) y, sobre todo, **transacciones ACID**: sin ellas la regla de cupos no se puede garantizar.                                                                         |
| D4  | **Prisma 6** como ORM, fijado a la major 6                            | TypeORM, Prisma 7                              | Tipado end-to-end y migraciones versionadas. La 7 elimina `url`/`directUrl` del schema y rompe la configuración de Supabase: subir es trabajo propio, no un `npm update` (ver `README.md` → Trampas conocidas). |
| D5  | **JWT de vida corta en memoria + refresh opaco en cookie `httpOnly`** | Solo JWT, o sesión en servidor                 | Un XSS no puede leer ni el refresh (es `httpOnly`) ni robar un access token del disco (nunca toca `localStorage`). Detalle en [`AUTH_FLOW.md`](../AUTH_FLOW.md).                                                |
| D6  | **Enlace de videollamada manual en Fase 1**                           | Daily.co, Google Meet API                      | El valor diferencial es el control de acceso, no generar la sala. Ver [§13.2](#132-videollamadas-por-qué-enlace-manual-en-fase-1).                                                                              |
| D7  | **Vite + React 19 SPA**                                               | Next.js                                        | No hay necesidad de SSR ni SEO: todo el producto vive tras autenticación.                                                                                                                                       |
| D8  | **Tailwind v4 con config en CSS**                                     | Tailwind v3 con `tailwind.config.js`           | Un solo lugar para tokens y tema. **No se crea `tailwind.config.js`.**                                                                                                                                          |
| D9  | **Contador `currentBookings` + `SELECT … FOR UPDATE`**                | `COUNT` en la transacción, o restricción en BD | Una sola fila que bloquear y lectura de cupo O(1) en el listado. Ver [§4.2](#42-cupos-y-concurrencia).                                                                                                          |
| D10 | **Asistencia manual marcada por el profesor**                         | Registro automático al revelar el enlace       | Con enlace manual de Zoom/Meet, "vio el enlace" no es "asistió".                                                                                                                                                |
| D11 | **`@nestjs/schedule` con cron interno** para recordatorios            | BullMQ + Redis, cron externo                   | Suficiente para el volumen de Fase 1 con una instancia. No mete Redis en el stack todavía.                                                                                                                      |
| D12 | **AES-256-GCM en aplicación** para el enlace                          | `pgcrypto`, o no cifrar                        | Cifrado autenticado del módulo `crypto` de Node, sin dependencias nuevas ni extensiones de PostgreSQL que compliquen los tests locales.                                                                         |

---

## 3. Stack tecnológico

Lo que hay instalado de verdad. Si esta tabla y `package.json` no coinciden, gana `package.json` y
hay que corregir esta tabla.

### Backend — `apps/api`

| Pieza                 | Qué usamos                                 | Nota                                        |
| --------------------- | ------------------------------------------ | ------------------------------------------- |
| Framework             | `@nestjs/*` 11                             | Monolito modular.                           |
| Runtime               | Node ≥ 20 (probado 22.x)                   | Fijado en `engines`.                        |
| ORM                   | `prisma` / `@prisma/client` **^6**         | **No subir a 7** sin HU propia.             |
| BD                    | PostgreSQL 17                              | Docker en dev, Supabase en staging/prod.    |
| Validación de entrada | `class-validator` + `class-transformer`    | En los DTO, en el controller.               |
| Validación de entorno | `zod` 4 (`config/env.schema.ts`)           | La app **no arranca** sin las obligatorias. |
| Auth                  | `@nestjs/jwt`, `bcryptjs`, `cookie-parser` | Ver [§8](#8-seguridad-y-autenticación).     |
| Rate limiting         | `@nestjs/throttler`                        | Solo `login` y `register`.                  |
| Tests                 | `vitest` 4                                 | `src/**/*.spec.ts`.                         |

### Frontend — `apps/web`

| Pieza           | Qué usamos                                                      | Nota                                                                  |
| --------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Build           | `vite` 8 + `@vitejs/plugin-react`                               | SPA.                                                                  |
| UI              | `react` 19 + `react-dom` 19                                     |                                                                       |
| Rutas           | `react-router-dom` 6                                            | Cada cambio de ruta mueve el foco al `<h1>`.                          |
| Estilos         | `tailwindcss` 4 vía `@tailwindcss/vite`                         | Tema en `src/index.css`. Sin `tailwind.config.js`.                    |
| Componentes     | `shadcn` 4 sobre **Base UI** (`@base-ui/react`)                 | `style: "base-nova"`. Base UI usa la prop `render`, **no `asChild`**. |
| Íconos          | `lucide-react`                                                  |                                                                       |
| Variantes       | `class-variance-authority` + `clsx` + `tailwind-merge` (`cn()`) |                                                                       |
| Tipografía      | `@fontsource-variable/geist`                                    | Cuerpo 17px.                                                          |
| Estado servidor | `@tanstack/react-query` 5                                       | Aulas, cupos, reservas, historial.                                    |
| Estado UI       | `zustand` 5                                                     | Sesión en memoria, preferencias, filtros.                             |
| HTTP            | `axios`                                                         | `lib/http-client.ts` desenvuelve `ApiResponse` y renueva ante 401.    |
| Tests           | **ninguno instalado**                                           | Ver [§10.2](#102-el-hueco-de-tests-del-frontend).                     |

> **Nota de auditoría — corrección de stack.** El `.docx` decía "TypeORM" en tres secciones (§6,
> §9.2, §12.3) aunque su propia §5.3 decidía Prisma; el repo usa **Prisma**. También decía
> "shadcn/ui + Tailwind" sin versión, cuando el repo usa **Tailwind v4 sobre Base UI**, que cambia
> cómo se escribe cada componente. Corregido contra `package.json`.

**Las convenciones de UI, color, tipografía, accesibilidad y microcopy no se documentan aquí.**
Viven en el skill `.claude/skills/bighearts-ui/`, que es su fuente de verdad.

---

## 4. Reglas de negocio — Fase 1

El **qué** y el **por qué** de estas reglas está en
[`DEFINICION_PROYECTO.md` §4.3](./DEFINICION_PROYECTO.md#43-las-reglas-que-hacen-la-diferencia).
Aquí está su especificación técnica.

### 4.1 La ventana de acceso al enlace

| Aspecto             | Regla                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Almacenamiento      | `Classroom.meetingLink` cifrado con **AES-256-GCM**; clave en `MEETING_LINK_KEY` (env, validada por Zod como `JWT_SECRET`). Nunca en claro en la BD ni en logs. |
| Quién puede verlo   | El profesor dueño del aula, **siempre**. Un estudiante, **solo** con `Booking.status = CONFIRMED`.                                                              |
| Cuándo se revela    | Desde `scheduledAt − ACCESS_WINDOW_MINUTES` (por defecto **30**) hasta el final de la clase.                                                                    |
| Fuera de la ventana | El campo **no viaja en la respuesta**. No se envía cifrado ni vacío: se omite. El frontend nunca debe recibir algo que no puede mostrar.                        |
| Dónde se decide     | En el **servidor**, siempre. El frontend replica la lógica solo para pintar el estado, nunca como control de acceso.                                            |

### 4.2 Cupos y concurrencia

El punto técnicamente más crítico de la Fase 1. Dos estudiantes pidiendo el último cupo a la vez
tienen que resolverse con exactamente un ganador.

`Classroom` mantiene un contador **`currentBookings`**, y toda mutación de reserva ocurre dentro de
una transacción que primero bloquea la fila del aula:

```sql
BEGIN;
  SELECT current_bookings, max_students
    FROM classrooms
   WHERE id = $classroomId
     FOR UPDATE;                    -- serializa a los competidores

  -- si current_bookings >= max_students → abortar con CLASSROOM_FULL
  -- si el estudiante ya tiene una reserva CONFIRMED en un horario solapado → abortar

  INSERT INTO bookings (student_id, classroom_id, status) VALUES (…, 'CONFIRMED');
  UPDATE classrooms SET current_bookings = current_bookings + 1 WHERE id = $classroomId;
COMMIT;
```

Reglas que se derivan de esto y **no son negociables**:

- El contador **solo** se toca dentro de la misma transacción que crea o cancela la reserva. Nunca
  en un `update` suelto.
- Cancelar decrementa el contador en la misma transacción en la que se marca `CANCELLED`.
- El frontend **no hace mutaciones optimistas** sobre reservas: el cupo se muestra reservado
  únicamente cuando el servidor confirma. Esta regla también está en el skill de UI.
- Cualquier HU que toque `bookings` necesita un test de concurrencia (dos transacciones
  simultáneas sobre el último cupo).

> **Nota de auditoría — campo inexistente.** El `.docx` §9.3 escribía esta misma transacción
> verificando `currentBookings`, pero su modelo de datos (§8.2) **no definía ese campo**. La regla
> más crítica del sistema estaba especificada contra una columna que no existía. Queda añadida al
> modelo.

### 4.3 Cancelación y re-reserva

- Un estudiante puede cancelar hasta **`CANCELLATION_WINDOW_MINUTES` antes** de `scheduledAt`
  (por defecto **60**). Pasado ese punto, la reserva queda firme.
- Cancelar libera el cupo de inmediato (decremento del contador en la misma transacción).
- La fila de la reserva **no se borra**: pasa a `CANCELLED` y permanece en el historial.
- Un estudiante que canceló **puede volver a reservar** la misma clase si hay cupo. Esto exige un
  **índice único parcial**, no uno total:

  ```sql
  CREATE UNIQUE INDEX bookings_active_uniq
      ON bookings (student_id, classroom_id)
   WHERE status = 'CONFIRMED';
  ```

> **Nota de auditoría — bug de diseño corregido.** El `.docx` §8.3 imponía un índice único total
> sobre `(studentId, classroomId)`. Con él, un estudiante que cancelaba quedaba **permanentemente
> impedido** de volver a reservar esa clase, porque la fila cancelada seguía ocupando el índice.
> Sustituido por el índice parcial de arriba.

### 4.4 No solapamiento

Un estudiante no puede tener dos reservas `CONFIRMED` cuyos intervalos
`[scheduledAt, scheduledAt + durationMinutes)` se solapen. Se valida **dentro de la transacción de
reserva** (§4.2), no antes: comprobarlo fuera deja una carrera abierta.

### 4.5 Registro y aprobación

- Estudiantes: nacen `ACTIVE`.
- Profesores: nacen `PENDING` si `TEACHER_APPROVAL_REQUIRED` (por defecto `true`), y `ACTIVE` si
  está desactivado. Un profesor `PENDING` **no puede crear aulas** y **no puede iniciar sesión**
  (la API responde `ACCOUNT_PENDING`).
- El administrador **aprueba** (`PENDING → ACTIVE`) o **rechaza** (`PENDING → REJECTED`). Las tres
  transiciones son las únicas válidas desde `PENDING`; cualquier otra responde
  `INVALID_STATUS_TRANSITION`.
- `ADMIN` no es un rol auto-registrable: solo se crea por seed o administración
  (`RegisterableRole` en `@academia/types` lo excluye a nivel de tipo).

> **Decisión D13 (2026-08-18) — `REJECTED` es un estado propio, no `SUSPENDED`.** `SUSPENDED`
> significa "cuenta deshabilitada por un administrador"; un profesor rechazado nunca estuvo activo.
> Reusarlo obligaría a decirle "tu cuenta fue suspendida", que es falso, y el microcopy de este
> producto es deliberadamente literal (skill `bighearts-ui`). Cada estado tiene su código de error
> en el login: `ACCOUNT_PENDING`, `ACCOUNT_REJECTED`, `ACCOUNT_SUSPENDED`.

### 4.6 Notificaciones

Emails transaccionales en: reserva confirmada, cancelación por el estudiante, cancelación del aula
por el profesor, y recordatorios **24 h** y **30 min** antes.

Los recordatorios los dispara un cron interno de `@nestjs/schedule` que barre periódicamente las
reservas `CONFIRMED` con aviso pendiente. Implicaciones:

- Cada reserva necesita marcas de "aviso 24 h enviado" y "aviso 30 min enviado" para que el barrido
  sea idempotente y no duplique correos al reiniciar el proceso.
- El recordatorio de 30 min y la apertura de la ventana de acceso (§4.1) son **el mismo instante**,
  a propósito: el correo llega justo cuando el enlace ya se puede ver.
- Con más de una instancia de la API, este diseño duplicaría envíos. Hoy Render corre una sola. Si
  eso cambia, hay que migrar a BullMQ (D11) o poner un lock en BD.

> **Decisión D14 (2026-08-18) — el envío es un puerto con dos adaptadores.** `NotificationsModule`
> expone la interfaz **`NotificationService`**; quien la llama nunca sabe cómo se envía. En Fase 1
> la implementación activa es **`LoggingNotificationService`**, que registra destinatario, tipo de
> evento y resultado de forma estructurada. El adaptador real (proveedor, plantillas, reintentos)
> llega en el Sprint 4 y **sustituye la implementación sin tocar a ningún llamador**.
>
> Esto existe porque HU-104 necesita notificar el resultado de una aprobación antes de que haya
> infraestructura de correo. El puerto deja el AC verificable hoy —con un espía en los tests— y
> evita rehacer el cableado después. **El proveedor concreto sigue sin decidir; ver §14.6.**

### 4.7 Tiempo y zonas horarias

- `scheduledAt` se guarda como **`timestamptz` en UTC**. Sin excepciones.
- El frontend formatea a la zona del navegador con `Intl.DateTimeFormat`, y **siempre muestra la
  zona explícita** (`Martes 12 de agosto, 6:00 p.m. (hora de Colombia)`), como exige el microcopy
  del skill de UI.
- Toda comparación temporal (ventana de acceso, ventana de cancelación, "en curso") ocurre en el
  **servidor** contra `now()` de la BD. El reloj del cliente no decide nada.

---

## 5. Estructura del monorepo

```
.
├── apps/
│   ├── api/          Backend NestJS.
│   └── web/          Frontend React + Vite.
├── packages/
│   └── types/        Contrato compartido entre api y web.
├── docs/             Definición, arquitectura e historias de usuario.
├── .claude/          CLAUDE.md, skills y comandos de Claude Code.
├── docker-compose.yml
├── eslint.config.mjs · .prettierrc.json · commitlint.config.mjs
├── tsconfig.base.json
└── package.json      Declara los workspaces.
```

> **Nota de auditoría — el `.docx` no sabía que esto era un monorepo.** Describía dos árboles de
> carpetas sueltos (§9.1 y §10.1), sin workspaces, sin paquete de tipos compartido y sin la regla
> del lockfile único. Sección reescrita.

### 5.1 Reglas duras del monorepo

1. **Un solo `package-lock.json`, en la raíz.** Nunca dentro de `apps/*` ni `packages/*`. Si
   aparece uno, se borra y se reinstala desde la raíz.
2. **`npm install` siempre desde la raíz.**
3. **`@academia/types` se compila antes que las apps.** `npm run build` ya lo hace explícitamente;
   `npm run build --workspaces` por sí solo **no** respeta el orden de dependencias.

El detalle operativo (instalar, añadir dependencias a un workspace, Docker, seed) está en
[`README.md`](../README.md); no se repite aquí.

### 5.2 Trampas conocidas

Cinco cosas que ya mordieron, están resueltas y **no hay que reintroducir**: `optimizeDeps` de
Vite, `incremental` en el tsconfig de la API, el orden de build de los tipos, Prisma fijado a la 6,
y las consultas a `information_schema` a través del pooler. Están documentadas con su explicación
completa en [`README.md` → Trampas conocidas](../README.md#trampas-conocidas) y comentadas junto a
la línea de código que las evita.

### 5.3 El paquete de tipos compartidos

`@academia/types` es la **única fuente de verdad del contrato back ↔ front**. Contiene:

- Los enums de dominio (`UserRole`, `UserStatus`, `HearingLossLevel`, `CommunicationPreference`) —
  emitidos como valores en runtime, no `const enum`, para que el backend los valide y el frontend
  los itere al pintar selectores.
- Las formas de entrada y salida de cada endpoint (`RegisterInput`, `LoginInput`, `AuthSession`…).
- El envelope `ApiResponse<T>` y el catálogo `ApiErrorCode`.

Reglas: **agnóstico de framework** (ni decoradores de NestJS ni tipos de React), y **nunca expone
datos sensibles** — el tipo `User` es deliberadamente un subconjunto del modelo de Prisma, sin
`password`, para que sea imposible serializar el hash por accidente.

Los enums de Prisma y los de este paquete comparten miembros **a propósito** y deben cambiarse
juntos.

---

## 6. Backend

### 6.1 Módulos

| Módulo          | Responsabilidad                                                                     | Estado  |
| --------------- | ----------------------------------------------------------------------------------- | ------- |
| `config`        | Validación del entorno con Zod y config global.                                     | ✅      |
| `prisma`        | `PrismaService` global.                                                             | ✅      |
| `common`        | Filtro de excepciones, interceptor de respuesta, factoría de errores de validación. | ✅      |
| `health`        | `GET /health` — proceso + BD.                                                       | ✅      |
| `auth`          | Registro, login, refresh, logout, guards.                                           | ✅      |
| `users`         | Perfil propio (`GET`/`PATCH /users/me`). La gestión de terceros vive en `admin`.    | ✅      |
| `classrooms`    | Aulas, horarios, cupos, enlace.                                                     | ⬜ Stub |
| `bookings`      | Reservas, concurrencia, cancelaciones.                                              | ⬜ Stub |
| `sessions`      | Reservado (ver nota).                                                               | ⬜ Stub |
| `notifications` | Emails transaccionales y recordatorios.                                             | ⬜ Stub |
| `admin`         | Aprobación de profesores, back-office.                                              | ⬜ Stub |

> **Nota de auditoría — `SessionsModule` no tiene datos que gobernar.** El `.docx` lo declaraba
> como módulo pero **nunca definió una entidad `Session`**: el historial y la asistencia viven en
> `Booking`. En Fase 1 no se crea esa entidad; la carpeta queda reservada para Fase 1.5, donde una
> serie recurrente sí necesitará instancias de sesión separadas del aula. **Decisión de auditoría,
> márcala si no estás de acuerdo.**

### 6.2 Patrón por módulo

**Controller → Service → Prisma.**

- **Controller** — recibe el HTTP, valida el DTO de entrada con `class-validator`, delega. Sin
  lógica de negocio.
- **Service** — toda la lógica. Lanza errores de dominio tipados. Habla con `PrismaService`
  directamente.
- **DTOs** — uno de entrada por operación, derivado de los tipos de `@academia/types`.
- **Guards** — autenticación global, con `@Public()` para las excepciones, y control por rol.

> **Nota de auditoría — no hay capa Repository.** El `.docx` §9.2 prescribía
> `Controller → Service → Repository`, con el Service ignorante del ORM. El código real (ver
> `auth/auth.service.ts`) usa `PrismaService` desde el Service, sin capa intermedia. Se documenta
> **el patrón real**, no el aspiracional: Prisma ya es una capa de abstracción y una segunda solo
> añadiría ceremonia. Si en algún módulo la lógica de datos crece lo suficiente, se introduce ahí y
> se anota aquí.

### 6.3 Contrato de respuesta

**Toda** respuesta de la API va envuelta, mediante un interceptor global:

```jsonc
{ "success": true,  "data": { … },                    "timestamp": "…" }
{ "success": false, "error": { "code", "message", "details?" }, "timestamp": "…" }
```

`code` sale del catálogo `ApiErrorCode` de `@academia/types` y es **estable**: el frontend decide
qué mensaje mostrar a partir de él, nunca parseando `message`. Los errores de validación llevan
`details.fields[]` con `{ field, message }`, que es lo que el formulario usa para pintar el error
bajo cada input.

### 6.4 Configuración y arranque

`config/env.schema.ts` es la única fuente de verdad de las variables de entorno: el tipo `Env` se
infiere de ahí, así que esquema y tipos no pueden desincronizarse. Si falta una obligatoria o está
malformada, **la app se niega a arrancar** y dice cuál.

Variables que introduce esta auditoría y aún no existen en el esquema:

| Variable                      | Por defecto     | Para qué                                 |
| ----------------------------- | --------------- | ---------------------------------------- |
| `MEETING_LINK_KEY`            | — (obligatoria) | Clave AES-256-GCM del enlace (§4.1).     |
| `ACCESS_WINDOW_MINUTES`       | `30`            | Apertura de la ventana de acceso (§4.1). |
| `CANCELLATION_WINDOW_MINUTES` | `60`            | Límite de cancelación (§4.3).            |

**`/health` es una readiness probe**, no un ping: la API arranca aunque la BD esté caída y devuelve
`503 DATABASE_UNAVAILABLE` hasta que vuelve, en vez de entrar en crash-loop.

---

## 7. Modelo de datos

Convenciones: `id` UUID v4, nombres de tabla en plural, columnas mapeadas a `snake_case` con
`@map`, `createdAt`/`updatedAt` en todo lo que se audita.

### 7.1 Implementado

**`User`** — `id`, `email` (único), `password` (hash bcrypt, **nunca** sale por la API), `firstName`,
`lastName`, `role`, `status`, `hearingLossLevel?`, `communicationPreference?`, timestamps.

**`RefreshToken`** — `id`, `tokenHash` (SHA-256, único), `userId`, `expiresAt`, `revokedAt?`,
`createdAt`. Solo se guarda el hash: si se filtra la BD, los tokens no son reutilizables.

> **Nota de auditoría.** El `.docx` §12.1 describía el refresh token en BD pero **no lo modelaba**
> en §8. Ya existe y está documentado aquí.

### 7.2 Planificado — Fase 1

**`Classroom`**

| Campo                  | Tipo                                                | Nota                                                                  |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `id`                   | UUID                                                |                                                                       |
| `teacherId`            | UUID → `User`                                       | Solo el dueño edita o cancela.                                        |
| `title`, `description` | text                                                |                                                                       |
| `level`                | enum `BEGINNER \| INTERMEDIATE \| ADVANCED`         |                                                                       |
| `maxStudents`          | int                                                 | Cupo máximo.                                                          |
| `currentBookings`      | int, default 0                                      | **Solo se muta dentro de la transacción de reserva** (§4.2).          |
| `scheduledAt`          | `timestamptz`                                       | UTC (§4.7).                                                           |
| `durationMinutes`      | int                                                 |                                                                       |
| `meetingLink`          | text                                                | **Cifrado AES-256-GCM** (§4.1).                                       |
| `meetingProvider`      | enum `MANUAL \| DAILY \| GOOGLE_MEET \| ZOOM`       | En Fase 1 siempre `MANUAL`.                                           |
| `status`               | enum `DRAFT \| PUBLISHED \| CANCELLED \| COMPLETED` | Nace `PUBLISHED` (D15). `DRAFT` y `COMPLETED` sin escritor en Fase 1. |
| `isRecurring`          | bool, default false                                 | Gancho para Fase 1.5. **Sin regla de recurrencia en Fase 1.**         |

> **Decisión D15 (2026-08-18) — el aula nace `PUBLISHED`.** `POST /classrooms` la publica de
> inmediato; no hay flujo de borrador en Fase 1. Crear un aula tiene que costar menos que abrir un
> grupo de WhatsApp, y un paso extra de publicación es fricción sin beneficio — la adopción por
> parte de los profesores es un riesgo declarado en `DEFINICION_PROYECTO.md` §8.2. `DRAFT` se queda
> en el enum, reservado para Fase 1.5.

> **Decisión D16 (2026-08-18) — nadie escribe `COMPLETED` en Fase 1.** El estado "finalizada" se
> **deriva por tiempo** (`now ≥ scheduledAt + durationMinutes`), como ya especifica §7.3, y los
> listados filtran por hora, no por este estado. La columna se persistirá cuando el profesor cierre
> la clase al marcar asistencia (HU-404), que es el momento natural de darla por terminada. No hay
> cron para esto: meter `@nestjs/schedule` en el Sprint 2 sería adelantar una pieza del Sprint 4
> sin que nada la necesite.
>
> **Consecuencia práctica:** una regla escrita contra `status = COMPLETED` nunca se dispararía hoy.
> Las reglas de "ya no se puede tocar" se escriben contra `scheduledAt`, no contra el estado.

**`Booking`**

| Campo                                      | Tipo                                                 | Nota                                                            |
| ------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| `id`                                       | UUID                                                 |                                                                 |
| `studentId`                                | UUID → `User`                                        |                                                                 |
| `classroomId`                              | UUID → `Classroom`                                   |                                                                 |
| `status`                                   | enum `CONFIRMED \| CANCELLED \| ATTENDED \| NO_SHOW` | `ATTENDED`/`NO_SHOW` los fija el profesor al marcar asistencia. |
| `bookedAt`, `cancelledAt?`                 | `timestamptz`                                        |                                                                 |
| `reminder24hSentAt?`, `reminder30mSentAt?` | `timestamptz`                                        | Idempotencia del cron (§4.6).                                   |

Índices: el único parcial de §4.3, más `(classroomId)` y `(studentId, status)` para el historial.

> **Nota de auditoría — dos máquinas de estado.** El `.docx` describía los estados del aula como
> `activa / pausada / finalizada` en §4.2 y como `DRAFT / PUBLISHED / CANCELLED / COMPLETED` en
> §8.2. Se adopta la segunda, que es la que tenía especificación de campo. No hay estado "pausada":
> un aula que no debe recibir reservas se cancela o no se publica.

### 7.3 Del estado de BD al estado de UI

El skill de UI define **nueve** estados visibles de aula (`<EstadoAula>`). Ninguno es una columna:
todos se **derivan** de `Classroom.status`, el contador de cupos, la hora actual y la reserva del
propio usuario. Este mapeo no existía en ningún documento y era una fuente segura de divergencia
entre back y front.

Se evalúa **en orden, primer match gana**:

| #   | Estado de UI           | Condición                                                                    |
| --- | ---------------------- | ---------------------------------------------------------------------------- |
| 1   | `pendiente-aprobacion` | El que mira es el profesor y su `User.status = PENDING`.                     |
| 2   | `cancelada`            | `Classroom.status = CANCELLED`.                                              |
| 3   | `finalizada`           | `Classroom.status = COMPLETED`, o `now ≥ scheduledAt + durationMinutes`.     |
| 4   | `en-curso`             | `scheduledAt ≤ now < scheduledAt + durationMinutes`.                         |
| 5   | `acceso-abierto`       | Mi `Booking` está `CONFIRMED` y `now ≥ scheduledAt − ACCESS_WINDOW_MINUTES`. |
| 6   | `reservada`            | Mi `Booking` está `CONFIRMED`.                                               |
| 7   | `llena`                | `currentBookings ≥ maxStudents`.                                             |
| 8   | `ultimos-cupos`        | `maxStudents − currentBookings ≤ 3`.                                         |
| 9   | `disponible`           | Cualquier otro caso.                                                         |

**Dónde vive la derivación:** en una función pura exportada por `@academia/types`, consumida por la
API al serializar y por el frontend al pintar. Es la única forma de que las dos capas no se
contradigan. Los estados 4, 5 y 3 dependen del reloj, así que la API envía los campos crudos
(`status`, `currentBookings`, `maxStudents`, `scheduledAt`, `durationMinutes`, `myBookingStatus`) y
el cliente re-deriva al re-renderizar; **pero el permiso para ver el enlace lo decide solo el
servidor** (§4.1).

> **Decisiones de auditoría a revisar:** el umbral de `ultimos-cupos` (≤ 3) y la ubicación de la
> función derivadora son propuestas mías; no estaban decididas en ningún sitio.

---

## 8. Seguridad y autenticación

El contrato completo de tokens, endpoints y renovación silenciosa está en
[`AUTH_FLOW.md`](../AUTH_FLOW.md). Aquí solo las invariantes que no se negocian:

| Invariante             | Valor                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hash de contraseña     | bcrypt, coste **12**.                                                                                                                                                    |
| Enumeración de cuentas | El login compara contra un **hash señuelo** cuando el email no existe, para que el tiempo de respuesta no revele si la cuenta existe.                                    |
| Access token           | JWT, **15 min**, viaja en el cuerpo, se guarda **en memoria** en el frontend. **Nunca en `localStorage`.**                                                               |
| Refresh token          | **Opaco**, 48 bytes de entropía, 30 días. En BD solo su **hash SHA-256**.                                                                                                |
| Transporte del refresh | Cookie `httpOnly`, `Path=/auth`. **Nunca viaja en el cuerpo.**                                                                                                           |
| Rotación               | Cada refresh revoca el token usado y emite otro. Presentar uno ya revocado se trata como robo: se **revoca toda la familia de sesiones** del usuario.                    |
| Rate limiting          | 5 intentos / 60 s por IP, **solo** en `login` y `register`.                                                                                                              |
| Autorización           | Guard de autenticación **global**; las rutas públicas se marcan con `@Public()`. El rol se comprueba en el servidor: el frontend replica la lógica solo para ocultar UI. |
| Secretos               | Siempre por entorno, validados por Zod. Nunca en el código.                                                                                                              |
| CORS                   | Solo `localhost:*` en desarrollo; en staging/producción, whitelist explícita en `CORS_ORIGIN`.                                                                           |

> **Nota de auditoría.** El `.docx` §12 describía un diseño **más débil** que el implementado:
> mencionaba el refresh token en BD pero no la cookie `httpOnly`, ni el `Path` restringido, ni la
> rotación, ni la detección de reuso, ni el hash señuelo. Actualizado a lo que el código hace.

---

## 9. Frontend

Arquitectura **feature-based**: se agrupa por dominio, no por tipo de archivo.

```
apps/web/src/
├── main.tsx            Bootstrap de React e import de index.css.
├── index.css           Tailwind v4 + tema (@theme) + tokens de color.
├── app/                Cableado transversal: App, providers, router.
├── pages/              Un componente por ruta.
├── features/           Módulos de dominio: auth/ (y aulas/, reservas/… por venir),
│                       cada uno con api/, components/, hooks/, lib/.
├── components/
│   ├── ui/             Primitivas de shadcn sobre Base UI.
│   └── dominio/        Componentes del dominio BigHearts (aún por crear).
├── hooks/              useAnnounce (región viva), usePageTitle (foco al <h1>).
├── lib/                http-client, api-error, refresh-session, query-client, cn().
└── stores/             Zustand: sesión en memoria y preferencias.
```

> **Nota de auditoría — la ruta del tema estaba mal.** El skill de UI y `UI_GUIDELINES.md` decían
> que los tokens viven en `src/styles/globals.css`. **Esa carpeta no existe**: el archivo real es
> `src/index.css`, y es al que apunta `components.json`. Igualmente, ambos decían
> `style: "base-vega"` cuando `components.json` dice **`base-nova`**. Corregido contra el código.

**Reparto de estado**, sin zonas grises:

| Tipo        | Herramienta               | Ejemplos                                                                  |
| ----------- | ------------------------- | ------------------------------------------------------------------------- |
| Servidor    | React Query               | Aulas, cupos, reservas, historial, perfil.                                |
| UI y sesión | Zustand                   | Access token en memoria, preferencias de accesibilidad, filtros, modales. |
| Local       | `useState` / `useReducer` | Formularios, toggles.                                                     |

Los cupos, las aulas y las reservas **nunca** van en Zustand: son estado de servidor con
concurrencia real.

**Accesibilidad ya implementada** que ningún documento registraba: `<LiveAnnouncer>` + `useAnnounce`
(región `aria-live`), `<SkipLink>`, `usePageTitle` (mueve el foco al `<h1>` en cada cambio de ruta),
y la variante `hc` de alto contraste elegible desde el perfil. El resto de reglas de accesibilidad
está en el skill de UI, que es su fuente de verdad.

---

## 10. Calidad, tests y CI

### 10.1 Lo que hay

| Pieza                                                                          | Estado            |
| ------------------------------------------------------------------------------ | ----------------- |
| ESLint (flat config) + Prettier, todo el repo                                  | ✅                |
| Husky `pre-commit` → `lint-staged` sobre los ficheros staged                   | ✅                |
| Husky `commit-msg` → commitlint (Conventional Commits)                         | ✅                |
| CI en cada PR a `main`: backend `lint + build + test`, frontend `lint + build` | ✅                |
| Tests de backend con Vitest (`src/**/*.spec.ts`)                               | ✅ Solo en `auth` |
| Tests de frontend                                                              | ❌ Ninguno        |
| Tests E2E                                                                      | ❌ Ninguno        |

### 10.2 El hueco de tests del frontend — decidido, pendiente de implementar

**Estado hoy:** `apps/web` no tiene runner de tests y su job de CI solo hace lint y build.
`packages/types` tampoco tiene runner. Mientras siga así, el skill `bighearts-dod` **no puede
exigir tests de frontend**, y no los exige.

> **Decisión D17 (2026-08-18) — se cierra el hueco en HU-205, antes de HU-203.**
>
> El detonante fue concreto: HU-103 se cerró con dos criterios de aceptación anotados como
> "implementado, pero sin pasada manual". Un checklist de accesibilidad de diez puntos, recorrido a
> mano sobre código recién escrito, se degrada — y en un producto para personas sordas una
> regresión de accesibilidad no la reporta nadie: el usuario simplemente no consigue reservar.
>
> | Aspecto       | Decisión                                                                                                                                                                                                                                                     |
> | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | Runner        | **Vitest** en `apps/web` y en `packages/types`. Mismo runner que `@academia/api`; no se introduce Jest.                                                                                                                                                      |
> | Componentes   | **Testing Library sobre jsdom**, consultando por **rol accesible y texto visible**. Prohibido `data-testid`: si un elemento no se encuentra por su rol, el problema es el componente.                                                                        |
> | Accesibilidad | **`axe-core`** en los tests de componentes. Automatiza lo mecánico (roles, labels, `aria-*`, encabezados); **no sustituye** la pasada manual de teclado y lector de pantalla, la reduce.                                                                     |
> | CI            | El paso `test` **bloquea el merge**. Un test que no bloquea no existe.                                                                                                                                                                                       |
> | Cobertura     | **Sin umbral numérico.** Un porcentaje mínimo produce tests escritos para subir el porcentaje. Regla cualitativa en `bighearts-dod`: toda lógica de dominio del frontend tiene test, y todo componente de `components/dominio/` tiene test de accesibilidad. |
> | Alcance       | **No retroactivo.** `features/auth` y `features/profile` se cubren cuando se toquen.                                                                                                                                                                         |
>
> `packages/types` es la parte urgente: `derivarEstadoAula()` vive ahí y la T0 de HU-203 pide tests
> unitarios que hoy no tienen dónde ejecutarse.
>
> **Al cerrar HU-205 hay que actualizar esta sección, §10.1, `CLAUDE.md` y el skill
> `bighearts-dod`.** Hasta entonces, §10.1 dice la verdad.

### 10.3 Convención de ramas y commits

- Rama por HU: `hu-<número>-<slug>-<persona>` (o `<issue>-hu-<número>-<slug>-<persona>` cuando
  arranca desde un issue de GitHub).
- Commits: Conventional Commits con ámbito de workspace — `feat(api):`, `feat(web):`,
  `feat(types):`, `docs:`, `chore:`. Los valida commitlint; un mensaje que no cumple **no crea el
  commit**.
- Todo entra por PR. El CI en verde es condición de merge.

> **Nota de auditoría — convención no escrita.** El `README.md` documenta los commits, pero la
> convención de nombre de rama por HU solo existía en el historial de git. Queda registrada.

---

## 11. Infraestructura y despliegue

| Entorno       | Dónde                                           | Disparador                      |
| ------------- | ----------------------------------------------- | ------------------------------- |
| Desarrollo    | Docker Compose local (Postgres 17 + API + Vite) | `docker compose up`             |
| Staging — API | **Render**                                      | Merge a `main`                  |
| Staging — Web | **Vercel** (+ preview URL por PR)               | Merge a `main` / apertura de PR |
| Staging — BD  | **Supabase** (PostgreSQL 17)                    | Migraciones en el deploy        |

Supabase se accede por **dos** URLs: `DATABASE_URL` (pooler pgbouncer, puerto 6543) para las
consultas normales y `DIRECT_URL` (conexión directa, 5432) para las migraciones, porque pgbouncer
no soporta las sentencias que Prisma Migrate necesita. La imagen de Docker está pineada a la misma
major que Supabase (17) para no introducir deriva entre dev y prod.

El paso a paso (conectar cuentas, secretos, protección de rama, smoke test) está en
[`DEPLOYMENT.md`](../DEPLOYMENT.md) y en `render.yaml` / `vercel.json`. No se repite aquí.

> **Nota de auditoría.** El `.docx` §13 proponía "Railway / Render / VPS" con la BD en Railway y los
> archivos en Cloudinary. La realidad es **Render + Vercel + Supabase**, ya configurada y
> automatizada. Cloudinary/S3 no está integrado y no hace falta en Fase 1: no hay subida de
> archivos en el alcance.

---

## 12. Escalabilidad hacia fases siguientes

El monolito modular permite añadir dominio sin tocar lo existente:

- **Fase 1.5** — `PaymentsModule`; generación automática del enlace (Daily.co) detrás del mismo
  contrato de `meetingProvider`; recurrencia de aulas, que es donde `SessionsModule` cobra sentido
  (instancias de sesión separadas del aula).
- **Fase 2** — `ContentModule`, `ProgressModule`, `GamificationModule`; en el frontend, una feature
  `learn/` nueva.
- **Fase 3** — `AIModule` con sus propias dependencias, extraíble como servicio aparte si la
  inferencia genera carga significativa. Detalle en [§13.3](#133-fase-3--capacidades-de-ia).

Redis entra en el stack cuando haga falta caché, rate limiting distribuido o colas de trabajos — no
antes.

---

## 13. Anexos de referencia

> Decisiones ya tomadas. Se conserva el razonamiento por si hay que revisitarlas.
> **No hace falta leer esta sección para implementar una HU.**

### 13.1 Monolito modular vs microservicios

| Criterio                        | Monolito modular ✅             | Microservicios ❌                  |
| ------------------------------- | ------------------------------- | ---------------------------------- |
| Velocidad de desarrollo         | Alta — un repo, un contexto     | Baja — overhead de orquestación    |
| Complejidad operacional         | Baja — un deployable            | Alta — múltiples servicios y redes |
| Escalabilidad futura            | Alta con módulos bien separados | Muy alta, innecesaria hoy          |
| Adecuado al equipo (2 personas) | Sí                              | Requiere experiencia DevOps        |

### 13.2 Videollamadas: por qué enlace manual en Fase 1

| Criterio          | Enlace manual | Daily.co        | Google Meet API    | WebRTC propio   |
| ----------------- | ------------- | --------------- | ------------------ | --------------- |
| Complejidad       | Muy baja      | Baja            | Media              | Muy alta        |
| Costo             | $0            | Desde $0        | Requiere Workspace | Infra STUN/TURN |
| Control de acceso | En la app     | Tokens por sala | Completo           | Total           |
| SDK React         | N/A           | Sí, oficial     | Limitado           | Terceros        |
| Fase 1            | ✅            | ✅              | ⚠️                 | ❌              |

En Fase 1.5, **Daily.co** sobre Zoom o Meet: sus APIs exigen que el usuario final tenga cuenta en
esas plataformas o limitan las sesiones embebidas. Daily.co funciona dentro de la propia
plataforma con WebRTC nativo, sin cuenta externa del estudiante, y habilita métricas de asistencia
reales — lo que a su vez permitiría revisitar la decisión D10.

### 13.3 Fase 3 — capacidades de IA

| Capacidad                | Tecnología candidata                             | Integración                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| Texto → señas (avatar)   | SignAll, Synthesia, o modelo propio con Three.js | `AIModule` llama a la API externa y devuelve una URL de animación. |
| Señas → texto (cámara)   | MediaPipe Holistic + TensorFlow.js               | Inferencia en el navegador, o envío de frames al backend.          |
| Asistente de aprendizaje | API de Claude u OpenAI                           | `AIModule` con contexto del progreso del estudiante.               |

### 13.4 Migración futura a AWS/GCP

Si el volumen lo justifica: backend → ECS o EC2 con balanceador; BD → RDS PostgreSQL Multi-AZ;
frontend → CloudFront + S3; Redis → ElastiCache. La arquitectura monolítica modular no lo impide.

---

## 14. Registro de la auditoría (2026-08-14)

### 14.1 Correcciones (el documento decía algo que el código contradice)

| #   | Qué decía el `.docx`                                       | Qué dice el código                                                             | Sección     |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| 1   | TypeORM en §6, §9.2 y §12.3 (con §5.3 decidiendo Prisma)   | **Prisma 6**, fijado                                                           | §3, D4      |
| 2   | `Controller → Service → Repository`                        | **Sin capa Repository**; el Service usa `PrismaService`                        | §6.2        |
| 3   | Refresh token "en BD con hash", sin más                    | Cookie `httpOnly` `Path=/auth`, rotación, **detección de reuso**, hash señuelo | §8          |
| 4   | Railway/Render/VPS + BD en Railway + Cloudinary            | **Render + Vercel + Supabase**; sin almacenamiento de archivos                 | §11         |
| 5   | Dos árboles de carpetas sueltos                            | **Monorepo npm workspaces** con `@academia/types`                              | §5          |
| 6   | "mínimo 16px para texto body"                              | **17px** (`--text-base: 1.0625rem`)                                            | Skill de UI |
| 7   | `style: "base-vega"` (en el skill y en `UI_GUIDELINES.md`) | **`base-nova`** en `components.json`                                           | §9          |
| 8   | Tokens en `src/styles/globals.css`                         | **`src/index.css`**; `src/styles/` no existe                                   | §9          |
| 9   | Aprobación de profesor: "flag configurable" sin nombre     | `TEACHER_APPROVAL_REQUIRED`, default `true`                                    | §4.5        |

### 14.2 Contradicciones internas resueltas

| #   | Conflicto                                                                              | Resolución                                                                                                   |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 10  | `currentBookings` usado en §9.3, ausente del modelo en §8.2                            | Campo **añadido** al modelo (§7.2), con la regla de que solo se muta en la transacción (§4.2).               |
| 11  | Índice único total `(studentId, classroomId)` + cancelación que libera cupo            | **Índice único parcial** `WHERE status = 'CONFIRMED'` (§4.3). Era un bug: impedía re-reservar tras cancelar. |
| 12  | Estados del aula: `activa/pausada/finalizada` vs `DRAFT/PUBLISHED/CANCELLED/COMPLETED` | Se adopta el segundo. Sin estado "pausada" (§7.2).                                                           |
| 13  | Asistencia automática (§4.4) vs manual (Definición y HU-404)                           | **Manual**, marcada por el profesor (D10).                                                                   |
| 14  | Recurrencia prometida en §4.2, "futuro" en §8.2, ausente del alcance                   | **Fuera de Fase 1**; se conserva `isRecurring` como gancho.                                                  |
| 15  | `SessionsModule` declarado sin entidad `Session`                                       | Carpeta **reservada**, sin entidad en Fase 1 (§6.1). Decisión de auditoría a revisar.                        |
| 16  | Cancelación "e.g. 1 hora antes"                                                        | **60 min, configurable** por `CANCELLATION_WINDOW_MINUTES` (§4.3).                                           |
| 17  | No solapamiento sin respaldo en el alcance                                             | **Regla de Fase 1**, validada dentro de la transacción (§4.4).                                               |

### 14.3 Vacíos rellenados (el código ya lo decidía, ningún documento lo registraba)

Envelope `ApiResponse` y catálogo `ApiErrorCode` (§6.3) · validación de entorno con Zod y arranque
que falla rápido (§6.4) · `/health` como readiness probe (§6.4) · invariantes de auth: bcrypt 12,
hash señuelo, refresh opaco de 48 bytes, throttling 5/60 s (§8) · convenciones de BD: UUID, plural,
`@map` a snake_case (§7) · reglas duras del monorepo y lockfile único (§5.1) · primitivas de
accesibilidad ya implementadas en el frontend (§9) · convención de nombre de rama por HU (§10.3) ·
ausencia de tests en el frontend (§10.2).

### 14.4 Decisiones nuevas tomadas en esta auditoría

Cifrado del enlace con **AES-256-GCM** y `MEETING_LINK_KEY` (§4.1) · `timestamptz` en **UTC** con
render en la zona del usuario (§4.7) · **`@nestjs/schedule`** para los recordatorios, con marcas de
idempotencia en `Booking` (§4.6) · **mapeo completo** de estado de BD a los 9 estados de UI (§7.3).

### 14.5 Recortes

Eliminadas las secciones §2 (contexto y problema) y §3 (roadmap) del `.docx`, que duplicaban
—en versión más antigua— el documento de definición; ahora se referencian. Eliminada la §15 (lista
de HUs por sprint), superada por `docs/historias/`. Movido a anexos el análisis de video, la
migración a AWS/GCP y el detalle de Fases 2–3. Las secciones de despliegue, autenticación y puesta
en marcha se reducen a invariantes + enlace a `DEPLOYMENT.md`, `AUTH_FLOW.md` y `README.md`.

### 14.6 Pendiente de tu revisión

1. `SessionsModule` sin entidad en Fase 1 (§6.1).
2. Umbral de `ultimos-cupos` en 3 (§7.3).
3. Ubicación de la función derivadora de estado en `@academia/types` (§7.3).
   _Se materializa en HU-203, que la implementa con tests propios._
4. ~~Qué hacer con la ausencia de tests en el frontend antes de Sprint 2 (§10.2).~~
   **✅ Resuelto (2026-08-18) — D17.** Vitest + Testing Library + `axe`, bloqueando en CI, sin
   umbral de cobertura y sin cobertura retroactiva. Lo implementa **HU-205**, antes de HU-203.
5. **Proveedor de email** para el adaptador real de `NotificationService` (§4.6, D14). Bloquea el
   Sprint 4; no bloquea HU-104.
6. **Formato de paginación** del listado de aulas: `{ items, total, page, pageSize }` con
   `pageSize` 20 por defecto. Propuesto en HU-203, sin decidir formalmente.

---

## 15. Registro de decisiones — Sprint 2 (2026-08-18)

Tomadas al convertir HU-104 y las cuatro HUs del Sprint 2 a `docs/historias/`. Cada una nació de un
choque entre lo que la HU pedía y lo que el repo o estos documentos dicen.

| #   | Decisión                                                                            | Dónde | Motivó                                                                                                                      |
| --- | ----------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| D13 | `REJECTED` como estado propio de `UserStatus`                                       | §4.5  | HU-104 mandaba el rechazo a `SUSPENDED`, lo que obligaba a mentirle al usuario sobre su estado.                             |
| D14 | `NotificationService` como puerto, con `LoggingNotificationService` en Fase 1       | §4.6  | HU-104 pedía email y no existe infraestructura de correo.                                                                   |
| D15 | El aula nace `PUBLISHED`                                                            | §7.2  | HU-201 no decía en qué estado se crea, y `DRAFT` no tenía flujo de publicación en ninguna HU del sprint.                    |
| D16 | `COMPLETED` sin escritor; se deriva por tiempo hasta HU-404                         | §7.2  | HU-202 prohibía editar aulas `COMPLETED`, una regla que nunca se dispararía.                                                |
| D17 | Vitest + Testing Library + `axe` en `apps/web` y `packages/types`, bloqueando en CI | §10.2 | La T0 de HU-203 pedía tests unitarios en un workspace sin runner, y HU-103 cerró con dos AC de accesibilidad sin verificar. |

Correcciones aplicadas a las HUs al convertirlas, sin necesidad de decisión nueva:

- **HU-104** — el decorador `@Roles` no existía en el repo; pasa a ser task explícita (y HU-201
  depende de ella). El AC "un profesor aprobado puede crear aulas" no era verificable en el Sprint
  1, porque crear aulas es HU-201.
- **HU-201** — faltaba `currentBookings` en el modelo, que §4.2 exige para la transacción de cupos
  del Sprint 3. Añadido con valor `0`; nadie lo muta en este sprint.
- **HU-202** — "notificar a los estudiantes con reserva" salió del alcance: `Booking` no existe
  hasta el Sprint 3.
- **HU-203** — el cupo se calculaba con `COUNT` sobre reservas; corregido al contador
  `currentBookings` (D9). Se añade la función `derivarEstadoAula()` compartida (§7.3).
- **HU-204** — el enlace se limita al profesor dueño; la regla de estudiante y ventana de 30
  minutos queda aislada en un método que HU-303 extiende.
