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

> **Decisión D25 (2026-08-21, HU-204).** El enlace se revela **solo en `GET /classrooms/:id`**, y la
> decisión vive en **un único método privado del servicio** (`revelarElEnlace()`). En el Sprint 2 su
> regla completa es «el que pide es el profesor dueño»: la otra mitad de esta tabla —el estudiante
> con `Booking.status = CONFIRMED` dentro de la ventana— no tiene forma de evaluarse porque `Booking`
> no existe hasta el Sprint 3. **HU-304 extiende ese método, no el endpoint** — la regla en sí vive
> en la función pura `derivarAccesoAlEnlace()`, compartida con `BookingsService.listMisReservas()`
> para pintar la cuenta atrás en «Mis reservas» sin duplicarla.
>
> Y una regla que esta tabla no cubría: **un aula `CANCELLED` no revela su enlace a nadie, ni al
> profesor dueño.** Esa reunión no va a ocurrir; dar la URL solo serviría para que alguien entre a
> una sala que ya nadie atiende.

> **Decisión D26 (2026-08-21, HU-204).** **Un aula `CANCELLED` se puede abrir en su detalle**,
> aunque no aparezca en el catálogo. Quien llegue con el enlace guardado de la página tiene que
> poder entender qué pasó, y un 404 ahí se lee como un fallo de la plataforma justo cuando el usuario
> está confundido. `CLASSROOM_NOT_FOUND` queda reservado al id que no existe —y al malformado, que
> desde fuera es el mismo hecho—.

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

**Y un profesor no puede tener dos aulas `PUBLISHED` solapadas.** Nadie está en dos videollamadas a
la vez. Se valida al crear **y al editar**; las canceladas no ocupan horario. En los dos casos el
intervalo es cerrado por la izquierda y abierto por la derecha: una clase que termina a las 18:00 y
otra que empieza a las 18:00 **no** se solapan.

Además, un aula tiene **antelación mínima** (`CLASS_MIN_LEAD_MINUTES`, 60) y **duración máxima**
(`CLASS_MAX_DURATION_MINUTES`, 240). La antelación no es capricho: por debajo de la ventana de
acceso de §4.1, el enlace se revelaría en el mismo instante en que se publica la clase, y el
recordatorio de 24 h de §4.6 no llegaría nunca. Es un **aviso confirmable**, no un bloqueo — publicar
con poca antelación solo perjudica al propio profesor. El solapamiento sí bloquea.

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

### 4.8 Visibilidad y acciones por rol

Los tres roles comparten los mismos datos de aula; lo que cambia es **qué subconjunto ven y qué
pueden hacer con él**. Un endpoint por propósito, nunca uno con dos comportamientos según quién
llama.

| Vista       | Endpoint                | Quién                           | Qué incluye                             |
| ----------- | ----------------------- | ------------------------------- | --------------------------------------- |
| Catálogo    | `GET /classrooms`       | Cualquier sesión                | Solo `PUBLISHED` y futuras              |
| Mis aulas   | `GET /classrooms/mias`  | `TEACHER`, acotado **al token** | Las suyas: también canceladas y pasadas |
| Supervisión | `GET /admin/classrooms` | `ADMIN`                         | **Todas**, de todos los profesores      |

**Reglas que no se negocian:**

1. **Solo `STUDENT` reserva.** `POST /bookings` nace con `@Roles(STUDENT)`. Ningún otro rol ve
   jamás una acción de reservar: el elemento **no se pinta**, no se pinta deshabilitado.
2. **El `meetingLink` no viaja en ningún listado.** Ni al profesor dueño, ni al administrador. Se
   revela solo en el detalle y bajo la ventana de §4.1. La regla no tiene excepción por rol, y
   menos para el rol con más poder.
3. **El alcance sale del token, nunca de un parámetro.** No existe `?teacherId=` ni `?todas=true`.
   Un endpoint que cambia de alcance según un parámetro es por donde se cuelan los fallos de
   autorización.

   > **Precisión (D27, HU-208).** Lo que la regla prohíbe es **nombrar a un tercero** o **ampliar**
   > el alcance desde el query. `GET /classrooms?mias=true` no hace ninguna de las dos: es un
   > booleano sin id, el `teacherId` con el que filtra sale de `@CurrentUser()`, y **estrecha** un
   > catálogo que ese usuario ya podía ver entero. No puede revelar nada que la petición sin el
   > parámetro no devuelva ya. La prueba de si un parámetro nuevo cae del lado permitido es esa: si
   > lleva un id, o si con él se ve algo que sin él no se veía, está prohibido.

4. **El administrador es solo lectura sobre aulas ajenas** en Fase 1. No edita ni cancela el
   trabajo de un profesor. Dar ese poder necesita una decisión de producto que no está tomada.
5. **`/panel` es el inicio de todos los roles**, y su contenido cambia según quién entra. Para el
   `ADMIN`, ese inicio **es** su panel de operación.

> **Decisión D24 (2026-08-21, HU-207).** El filtro temporal de «Mis aulas» tiene **tres grupos
> disjuntos y exhaustivos** —`proximas`, `pasadas`, `canceladas`— y `todas` es su unión. El estado
> gana sobre la fecha: **una clase cancelada del mes que viene cuenta como `canceladas`, no como
> `proximas`**, porque no hay nada que preparar. Se decidió así para que los tres filtros sumen
> exactamente el total y ninguna aula aparezca dos veces. `todas` se sirve como dos listas
> concatenadas —próximas ascendente, historial descendente— porque el orden que pide el profesor
> cambia de sentido en `now`, y eso no es un `ORDER BY`.

> **Decisión D27 (2026-08-23, HU-208).** El filtro «Solo mis clases» del catálogo se resuelve en el
> **servidor**, con `GET /classrooms?mias=true`, y no filtrando en el navegador la página ya
> recibida. La HU lo planteó como un cambio solo de frontend, pero el catálogo pagina en el
> servidor: filtrar en el cliente dejaría `total` —y por tanto «Página 1 de 3»— contando aulas
> ajenas, y escondería las clases propias que cayeran en otra página, con el vacío «No tienes clases
> publicadas» apareciendo encima. El `teacherId` sale del token; ver la precisión de la regla 3.
>
> El resto de la HU sí es presentación pura y se deriva en el cliente a partir de `teacherId`, que
> ya viaja en `ClassroomListItem`: el distintivo `Tu clase`, la acción `Gestionar mi clase` y quién
> ve la acción de reservar. Coherente con §7.3 —la API manda los datos y el cliente deriva la
> presentación—, y el permiso real lo siguen decidiendo `PATCH`, `cancel` y `POST /bookings`.

> **Decisión D18 (2026-08-20).** El catálogo es único y la presentación varía por rol: el profesor
> ve sus propias clases marcadas y con acceso a gestionarlas, no a reservarlas. Se resolvió así en
> vez de darle una pantalla aparte porque ver la oferta completa es lo que le permite **coordinar
> horarios** con el resto de la academia, que es donde se producen los choques cuando hay varias
> clases del mismo nivel.

### 4.9 Accesibilidad declarada del aula

**Es lo que separa a BigHearts de una academia de inglés cualquiera.** El estudiante declara su
`communicationPreference` al registrarse; el aula declara en qué modos se imparte. Sin esa segunda
mitad, la primera no sirve para nada y el catálogo filtra por nivel y horario como filtraría
cualquier otro producto.

| Campo                | Qué es                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `communicationModes` | Conjunto de `CommunicationPreference`. **Obligatorio y no vacío** en las aulas nuevas. Un aula puede impartirse en varios modos a la vez. |
| `hasInterpreter`     | Hay intérprete de lengua de señas. Distinto de impartir en señas.                                                                         |
| `hasLiveCaptions`    | Hay subtítulos en vivo.                                                                                                                   |
| `hasVisualMaterials` | Hay materiales visuales de apoyo.                                                                                                         |
| `meetingProvider`    | A qué plataforma apunta el enlace (Zoom · Meet · Otra). Los subtítulos automáticos no funcionan igual en todas.                           |

**Reglas:**

1. **Se destaca, no se filtra.** El catálogo muestra **todas** las clases y marca las que coinciden
   con la preferencia del estudiante. Ocultarle clases por su preferencia sería decidir por él, y
   este producto existe para lo contrario. El filtro existe y **no viene puesto**.
2. **Nunca se marca una clase como vetada.** La coincidencia es información, no una puerta. Un
   estudiante puede reservar cualquier clase.
3. **A un aula sin modos declarados no se le inventa uno.** Las creadas antes de HU-211 quedan
   «sin indicar» y el profesor las completa. Rellenar la migración con un valor por defecto sería
   mentirle al estudiante sobre algo de lo que depende para seguir la clase.
4. **La declaración es de buena fe.** La plataforma no audita que el profesor cumpla lo que dice.

> **Decisión D21 (2026-08-20).** Se reutiliza el enum `CommunicationPreference` para el aula en vez
> de crear uno paralelo, para que el emparejamiento sea directo:
> `modosDelAula.includes(preferenciaDelEstudiante)`. La función vive en `@academia/types` y la usan
> las dos apps, como `derivarEstadoAula()`.

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

| Módulo          | Responsabilidad                                                                     | Estado                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `config`        | Validación del entorno con Zod y config global.                                     | ✅                                                                                                                          |
| `prisma`        | `PrismaService` global.                                                             | ✅                                                                                                                          |
| `common`        | Filtro de excepciones, interceptor de respuesta, factoría de errores de validación. | ✅                                                                                                                          |
| `health`        | `GET /health` — proceso + BD.                                                       | ✅                                                                                                                          |
| `auth`          | Registro, login, refresh, logout, guards.                                           | ✅                                                                                                                          |
| `users`         | Perfil propio (`GET`/`PATCH /users/me`). La gestión de terceros vive en `admin`.    | ✅                                                                                                                          |
| `classrooms`    | Aulas, horarios, cupos, enlace. Incluye `MeetingLinkCipher` (§4.1), que exporta.    | ✅ Crear, listar, detalle, editar, cancelar, «mis aulas», accesibilidad, coherencia temporal y ventana de acceso al enlace. |
| `bookings`      | Reservas, concurrencia, cancelaciones.                                              | ⬜ Stub                                                                                                                     |
| `sessions`      | Reservado (ver nota).                                                               | ⬜ Stub                                                                                                                     |
| `notifications` | Emails transaccionales y recordatorios.                                             | 🟨 Puerto + `LoggingNotificationService` (HU-104, D14). Adaptador real en Sprint 4.                                         |
| `admin`         | Aprobación de profesores y supervisión de aulas (solo lectura).                     | ✅ HU-104, HU-210                                                                                                           |

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

Variables que introdujo esta auditoría:

| Variable                      | Por defecto     | Estado                                                                  |
| ----------------------------- | --------------- | ----------------------------------------------------------------------- |
| `MEETING_LINK_KEY`            | — (obligatoria) | ✅ **En el esquema desde HU-201.** Clave AES-256-GCM del enlace (§4.1). |
| `ACCESS_WINDOW_MINUTES`       | `30`            | ✅ **En el esquema desde HU-304.** Ventana de acceso al enlace (§4.1).  |
| `CANCELLATION_WINDOW_MINUTES` | `60`            | ⬜ Pendiente. La introduce el Sprint 3 (§4.3).                          |
| `CLASS_MIN_LEAD_MINUTES`      | `60`            | ✅ **En el esquema desde HU-212.** Antelación mínima (§4.4).            |
| `CLASS_MAX_DURATION_MINUTES`  | `240`           | ✅ **En el esquema desde HU-212.** Duración máxima (§4.4).              |

`CLASS_MIN_LEAD_MINUTES` **no admite un valor menor que `ACCESS_WINDOW_MINUTES`** y el esquema lo
rechaza al arrancar: por debajo de la ventana de acceso, el enlace se revelaría en el mismo instante
en que se publica la clase y la ventana de §4.1 dejaría de significar nada. Los dos umbrales se
exportan además como `CLASS_MIN_LEAD_MINUTES_DEFAULT` y `CLASS_MAX_DURATION_MINUTES_DEFAULT` desde
`@academia/types`, pero **eso es el valor de fábrica del formulario, no la configuración**: la
autoridad es el servidor, que devuelve su número real dentro de `details`.

`MEETING_LINK_KEY` se valida como **64 caracteres hexadecimales**, los 32 bytes exactos que pide
AES-256, y no como "una cadena larga" al estilo de `JWT_SECRET`. Aceptar cualquier longitud
obligaría a derivar o rellenar la clave, y las dos cosas convierten un error de configuración en un
cifrado más débil de lo que el nombre de la variable promete. Se genera con `openssl rand -hex 32`.
**No hay rotación de claves en Fase 1**: cambiarla deja ilegibles los enlaces ya guardados. El
prefijo `v1.` del formato cifrado existe para poder añadirla sin migrar filas.

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

**`Classroom`** — implementado en HU-201 con todos los campos de §7.2. Notas de implementación:

- **`meetingLink` guarda texto cifrado**, con formato `v1.<iv>.<tag>.<ciphertext>` en base64
  (AES-256-GCM, IV de 96 bits aleatorio por escritura). Lo produce `MeetingLinkCipher`, en
  `apps/api/src/classrooms/`. GCM y no CBC porque el tag detecta manipulación: sin él, quien pudiera
  escribir en la BD cambiaría el enlace de una clase por el suyo y el descifrado devolvería la URL
  falsa sin avisar.
- `scheduledAt` es `TIMESTAMPTZ(3)`; el resto de fechas usa el `timestamp(3)` por defecto de Prisma.
- La relación con `User` es `onDelete: Restrict`: borrar un profesor no puede llevarse por delante
  clases que otros reservaron. Un profesor que se va se suspende y sus aulas se cancelan una a una.
- **El enlace no viaja en la respuesta de creación**, ni siquiera al profesor dueño: ya lo escribió
  él. La regla de quién puede verlo la implementa HU-204 y la completa HU-303, en un solo método.

> **Nota de auditoría.** El `.docx` §12.1 describía el refresh token en BD pero **no lo modelaba**
> en §8. Ya existe y está documentado aquí.

### 7.2 Planificado — Fase 1

**`Classroom`** — ✅ **implementado en HU-201**; la tabla de abajo es su especificación, y las notas
de implementación están en §7.1.

| Campo                  | Tipo                                                | Nota                                                                                                                                    |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | UUID                                                |                                                                                                                                         |
| `teacherId`            | UUID → `User`                                       | Solo el dueño edita o cancela.                                                                                                          |
| `title`, `description` | text                                                |                                                                                                                                         |
| `level`                | enum `BEGINNER \| INTERMEDIATE \| ADVANCED`         |                                                                                                                                         |
| `maxStudents`          | int                                                 | Cupo máximo.                                                                                                                            |
| `currentBookings`      | int, default 0                                      | **Solo se muta dentro de la transacción de reserva** (§4.2).                                                                            |
| `scheduledAt`          | `timestamptz`                                       | UTC (§4.7).                                                                                                                             |
| `durationMinutes`      | int                                                 |                                                                                                                                         |
| `meetingLink`          | text                                                | **Cifrado AES-256-GCM** (§4.1).                                                                                                         |
| `meetingProvider`      | enum `MANUAL \| DAILY \| GOOGLE_MEET \| ZOOM`       | ✅ **Implementado en HU-211.** El profesor lo declara al crear (Zoom, Meet u «Otra» = `MANUAL`); `DAILY` sigue reservado, sin escritor. |
| `status`               | enum `DRAFT \| PUBLISHED \| CANCELLED \| COMPLETED` | Nace `PUBLISHED` (D15). `DRAFT` y `COMPLETED` sin escritor en Fase 1.                                                                   |
| `isRecurring`          | bool, default false                                 | Gancho para Fase 1.5. **Sin regla de recurrencia en Fase 1.**                                                                           |
| `communicationModes`   | enum `CommunicationPreference[]`, `@default([])`    | ✅ **Implementado en HU-211.** **Obligatorio y no vacío** en aulas nuevas (§4.9); las de antes quedan `[]` — «sin indicar».             |
| `hasInterpreter`       | bool, default false                                 | ✅ **Implementado en HU-211.** Intérprete de lengua de señas.                                                                           |
| `hasLiveCaptions`      | bool, default false                                 | ✅ **Implementado en HU-211.** Subtítulos en vivo.                                                                                      |
| `hasVisualMaterials`   | bool, default false                                 | ✅ **Implementado en HU-211.** Materiales visuales de apoyo.                                                                            |

> **Decisión D25 (2026-08-21, HU-211; extendida 2026-08-24, HU-202) — `PATCH /classrooms/:id` nace
> acotado a los 5 campos de accesibilidad y HU-202 lo extiende.** El endpoint nació acotado a
> `communicationModes` y los cuatro campos de arriba porque HU-211 necesitaba una vía para sacar a un
> aula de «sin indicar» sin esperar a HU-202. Se resolvió así a propósito: **HU-202 EXTIENDE este
> mismo endpoint** con el resto de campos editables (título, horario, cupo, enlace), en un único
> `UpdateClassroomInput` con todo opcional — no abre un segundo `PATCH` ni un DTO paralelo. También
> trae `POST /classrooms/:id/cancel` y `CLASSROOM_NOT_EDITABLE` (409): ni editable ni cancelable una
> vez que `now ≥ scheduledAt`, o si ya está `CANCELLED`. Reutiliza `CLASSROOM_FORBIDDEN` (403,
> HU-211) para «no eres el dueño» en los dos endpoints.

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

> **`BookingStatus` ya existe en `@academia/types` desde HU-204**, con estos cuatro miembros y sin
> gemelo todavía en `schema.prisma`. Se adelantó para poder tipar `ClassroomDetail.myBookingStatus`
> —el campo que el detalle devuelve en `null` durante todo el Sprint 2—, de modo que HU-301 solo
> tenga que empezar a rellenarlo en vez de cambiar la forma del contrato. Cuando llegue el modelo, el
> enum de Prisma se crea contra esa lista, no contra otra.

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

| Invariante             | Valor                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hash de contraseña     | bcrypt, coste **12**.                                                                                                                                                                                                                                                                                                   |
| Enumeración de cuentas | El login compara contra un **hash señuelo** cuando el email no existe, para que el tiempo de respuesta no revele si la cuenta existe.                                                                                                                                                                                   |
| Access token           | JWT, **15 min**, viaja en el cuerpo, se guarda **en memoria** en el frontend. **Nunca en `localStorage`.**                                                                                                                                                                                                              |
| Refresh token          | **Opaco**, 48 bytes de entropía, 30 días. En BD solo su **hash SHA-256**.                                                                                                                                                                                                                                               |
| Transporte del refresh | Cookie `httpOnly`, `Path=/auth`. **Nunca viaja en el cuerpo.**                                                                                                                                                                                                                                                          |
| Rotación               | Cada refresh revoca el token usado y emite otro. Presentar uno ya revocado se trata como robo: se **revoca toda la familia de sesiones** del usuario.                                                                                                                                                                   |
| Rate limiting          | 5 intentos / 60 s por IP, **solo** en `login` y `register`.                                                                                                                                                                                                                                                             |
| Autorización           | Dos guards globales encadenados: `JwtAuthGuard` (las rutas públicas se marcan con `@Public()`) y, detrás, `RolesGuard`, que exige rol solo donde hay `@Roles(...)` y responde `INSUFFICIENT_ROLE`. El rol sale del access token, se comprueba **en el servidor**, y el frontend replica la lógica solo para ocultar UI. |
| Secretos               | Siempre por entorno, validados por Zod. Nunca en el código.                                                                                                                                                                                                                                                             |
| CORS                   | Solo `localhost:*` en desarrollo; en staging/producción, whitelist explícita en `CORS_ORIGIN`.                                                                                                                                                                                                                          |

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
├── features/           Módulos de dominio: auth/, admin/, aulas/, profile/, panel/
│                       (y reservas/… por venir), cada uno con api/, components/,
│                       hooks/, lib/.
├── components/
│   ├── ui/             Primitivas de shadcn sobre Base UI.
│   ├── layout/         El shell y la composición de página (HU-206): AppShell,
│   │                   PaginaCabecera, Contenedor, RejillaAulas, destinosPorRol.
│   └── dominio/        Componentes del dominio BigHearts: EstadoVacio, las tres
│                       ilustraciones y el diccionario visual de estados de aula.
├── hooks/              useAnnounce (región viva), usePageTitle (foco al <h1>),
│                       useEsMovil (corte de 640px del shell).
├── lib/                http-client, api-error, refresh-session, query-client, cn().
└── stores/             Zustand: sesión en memoria y preferencias.
```

**El shell (HU-206).** Todas las pantallas se montan sobre `<AppShell>`: marca, navegación superior
por rol —tres o cuatro destinos, **nunca lateral y nunca tras una hamburguesa**—, barra inferior
fija en móvil, y un `<main>` al que apunta el `<SkipLink>`. `<PaginaCabecera>` pone el único `<h1>`
de la pantalla y es quien llama a `usePageTitle`, así que ninguna página puede olvidarse de mover el
foco al cambiar de ruta. La especificación visual completa —anatomía, rejilla de 1/2/3 columnas,
regla del sólido, estilo de ilustración— vive en `layout-y-composicion.md` del skill `bighearts-ui`.

**Las rutas (actualizado en HU-209).** `<AppRouter>` monta el `<BrowserRouter>` y `<AppRoutes>` la
tabla; están separados para que un test pueda montar las rutas reales dentro de un `<MemoryRouter>`
y verificar a dónde lleva de verdad una URL.

| Ruta               | Sesión                | Qué es                                                        |
| ------------------ | --------------------- | ------------------------------------------------------------- |
| `/`                | Pública               | Portada.                                                      |
| `/login`           | Pública               | Redirige al panel si ya hay sesión.                           |
| `/registro`        | Pública               | —                                                             |
| `/panel`           | Cualquier rol         | **El inicio de los tres roles.** Ver abajo.                   |
| `/perfil`          | Cualquier rol         | —                                                             |
| `/aulas`           | Cualquier rol         | Catálogo único, presentación por rol (D18).                   |
| `/mis-clases`      | `STUDENT`             | Reservas del estudiante (contenido en Sprint 3).              |
| `/mis-aulas`       | `TEACHER`             | Listado del profesor, con filtro temporal en la URL (HU-207). |
| `/mis-aulas/nueva` | `TEACHER`             | Crear un aula (HU-201).                                       |
| `/admin`           | La que exija `/panel` | **Redirección a `/panel`.** No es una pantalla desde HU-209.  |
| `*`                | Pública               | 404.                                                          |

**`/panel` es una ruta con tres contenidos** (D19). `<RoleGate>` monta uno solo, así que las
consultas de los otros dos no se disparan: el estudiante ve sus reservas o el camino al catálogo, el
profesor sus próximas clases o el camino a crear una, y el administrador **la aprobación de
profesores como contenido principal** — que antes vivía en `/admin`, detrás de una tarjeta. `/admin`
no se elimina para que ningún marcador antiguo se rompa.

En escritorio y en móvil **solo se monta una de las dos barras** (`useEsMovil`), no las dos con una
oculta por CSS: con ambas en el DOM, un lector de pantalla leería cada destino dos veces.

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

| Pieza                                                                   | Estado                        |
| ----------------------------------------------------------------------- | ----------------------------- |
| ESLint (flat config) + Prettier, todo el repo                           | ✅                            |
| Husky `pre-commit` → `lint-staged` sobre los ficheros staged            | ✅                            |
| Husky `commit-msg` → commitlint (Conventional Commits)                  | ✅                            |
| CI en cada PR a `main`: los dos jobs con `lint + build + test`          | ✅                            |
| `npm run test` desde la raíz corre los tres workspaces                  | ✅                            |
| Tests de backend con Vitest (`src/**/*.spec.ts`)                        | ✅ `auth` y `users`           |
| Tests de `packages/types` con Vitest (`src/**/*.spec.ts`, entorno node) | ✅                            |
| Tests de frontend con Vitest + Testing Library sobre jsdom              | ✅ Infraestructura + patrones |
| Accesibilidad automatizada con `axe-core` en los tests de componente    | ✅                            |
| Cobertura del frontend: `features/auth` y `features/profile`            | ⬜ No retroactiva (D17)       |
| Tests E2E                                                               | ❌ Ninguno                    |

**Cómo se corren:**

```bash
npm run test                                 # los tres workspaces (compila tipos antes)
npm run test --workspace @academia/web       # solo frontend
npm run test:watch --workspace @academia/web # en watch, mientras escribes
```

### 10.2 Tests del frontend y de tipos — implementado en HU-205

**Estado hoy:** implementado. `apps/web` y `packages/types` tienen runner, el CI los ejecuta en
cada PR, y el skill `bighearts-dod` **ya exige** tests de frontend (§5 de ese skill).

Lo que existe en el repo:

| Pieza                                    | Dónde                                                                                             | Para qué                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Config de test del frontend              | `apps/web/vitest.config.ts`                                                                       | **Hereda `vite.config.ts` con `mergeConfig`**, no lo copia (ver abajo)                    |
| Setup de jsdom                           | `apps/web/src/test/setup.ts`                                                                      | Matchers de `@testing-library/jest-dom` + stub de `matchMedia`                            |
| `renderConProviders(ui, { tema, ruta })` | `apps/web/src/test/render-con-providers.tsx`                                                      | Monta con React Query + `LiveAnnouncer` + router de memoria, en `light` \| `dark` \| `hc` |
| `esperarSinFallosDeAccesibilidad(cont.)` | `apps/web/src/test/accesibilidad.ts`                                                              | Corre `axe` y **falla con el detalle** de cada violación, no con un booleano              |
| Config de test del contrato              | `packages/types/vitest.config.ts`                                                                 | Entorno `node`; los specs se excluyen de `dist` vía `tsconfig.build.json`                 |
| Patrones a copiar                        | `validate-login.spec.ts` (lógica pura) · `login-form.spec.tsx` (teclado) · `field.spec.tsx` (axe) | Los tres ejemplos que HU-205 dejó sobre código existente                                  |

> **Por qué la config de test hereda la de Vite y no se escribe aparte.** `vite.config.ts` contiene
> el alias `@/*` y `optimizeDeps.include: ['@academia/types']` — la trampa nº 1 del `README.md`, que
> existe porque el paquete se compila a CommonJS. Dos configs paralelas se desincronizan a la
> primera que alguien toque una sola de las dos, y el síntoma sería un test que falla al importar un
> **valor** (no un tipo) de `@academia/types`. Con `mergeConfig`, tocar `vite.config.ts` afecta a
> las dos a la vez, que es la única forma de enterarse.

> **Decisión D17 (2026-08-18) — implementada en HU-205, antes de HU-203.**
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
> `packages/types` era la parte urgente: `derivarEstadoAula()` vive ahí y la T0 de HU-203 pide
> tests unitarios que antes no tenían dónde ejecutarse. **Ya los tienen.**

**Lo que sigue sin cubrirse, a propósito:**

- **`features/auth` y `features/profile`.** Cobertura no retroactiva (D17). Los tres tests de
  ejemplo caen sobre `auth` porque era el código que existía, no porque `auth` esté cubierto.
- **E2E.** Se evalúa al cerrar la Fase 1, cuando haya flujos completos que merezca la pena recorrer
  de punta a punta.
- **Regresión visual y contraste calculado.** jsdom no aplica las hojas de Tailwind, así que la
  regla `color-contrast` de axe está desactivada en el helper: automatizarla ahí daría un falso
  verde. El contraste se verifica en `tokens.css` del skill `bighearts-ui` y a mano.
- **Umbral numérico de cobertura.** D17: un porcentaje mínimo produce tests escritos para subir el
  porcentaje.

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
   **✅ Resuelto (2026-08-18) — D17, e implementado en HU-205.** Vitest + Testing Library + `axe`,
   bloqueando en CI, sin umbral de cobertura y sin cobertura retroactiva. Ver §10.2.
5. **Proveedor de email** para el adaptador real de `NotificationService` (§4.6, D14). Bloquea el
   Sprint 4; **no bloquea el Sprint 3**: D29 emite los avisos de reserva por el puerto, que hoy
   escribe a log. El Sprint 4 cambia el `useClass` y nada más.
6. **Formato de paginación** del listado de aulas: `{ items, total, page, pageSize }` con
   `pageSize` 20 por defecto. Propuesto en HU-203, sin decidir formalmente.

---

## 15. Registro de decisiones — Sprint 2 (2026-08-18)

Tomadas al convertir HU-104 y las cuatro HUs del Sprint 2 a `docs/historias/`. Cada una nació de un
choque entre lo que la HU pedía y lo que el repo o estos documentos dicen.

| #   | Decisión                                                                                                                   | Dónde  | Motivó                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D13 | `REJECTED` como estado propio de `UserStatus`                                                                              | §4.5   | HU-104 mandaba el rechazo a `SUSPENDED`, lo que obligaba a mentirle al usuario sobre su estado.                                                                                                 |
| D14 | `NotificationService` como puerto, con `LoggingNotificationService` en Fase 1                                              | §4.6   | HU-104 pedía email y no existe infraestructura de correo.                                                                                                                                       |
| D15 | El aula nace `PUBLISHED`                                                                                                   | §7.2   | HU-201 no decía en qué estado se crea, y `DRAFT` no tenía flujo de publicación en ninguna HU del sprint.                                                                                        |
| D16 | `COMPLETED` sin escritor; se deriva por tiempo hasta HU-404                                                                | §7.2   | HU-202 prohibía editar aulas `COMPLETED`, una regla que nunca se dispararía.                                                                                                                    |
| D17 | Vitest + Testing Library + `axe` en `apps/web` y `packages/types`, bloqueando en CI                                        | §10.2  | La T0 de HU-203 pedía tests unitarios en un workspace sin runner, y HU-103 cerró con dos AC de accesibilidad sin verificar.                                                                     |
| D18 | Catálogo único con presentación por rol; solo `STUDENT` reserva                                                            | §4.8   | El profesor veía su propia clase igual que un estudiante, y HU-301 le habría pintado un botón de reservar encima.                                                                               |
| D19 | `/panel` es el inicio de cada rol; para el `ADMIN` es su panel de operación, y `/admin` redirige                           | §4.8   | El administrador aterrizaba en un panel genérico con su trabajo real escondido tras una tarjeta.                                                                                                |
| D20 | Vista de supervisión `GET /admin/classrooms`, solo lectura                                                                 | §4.8   | La Definición promete que el admin «gestiona la operación global» y no podía ver ni una clase. Amplía el alcance de Fase 1.                                                                     |
| D21 | El aula declara sus modos de comunicación y apoyos; se destaca la coincidencia, no se filtra                               | §4.9   | La preferencia del estudiante no se usaba en ninguna parte: el catálogo filtraba por nivel y horario como una academia genérica.                                                                |
| D22 | No solapamiento **del profesor**, antelación mínima y duración máxima                                                      | §4.4   | Se podía publicar una clase imposible: dos a la vez, de diez mil minutos, o con dos minutos de antelación.                                                                                      |
| D23 | Duplicar un aula, sin reabrir la recurrencia                                                                               | HU-213 | La Definición §8.2 declara la adopción del profesor como riesgo y crear un aula son once campos, incluido volver a pegar el enlace.                                                             |
| D27 | `GET /classrooms?mias=true`: el filtro «Solo mis clases» se resuelve en el servidor, con el `teacherId` del token          | §4.8   | HU-208 lo planteaba solo en frontend, pero el catálogo pagina en el servidor: filtrar en el cliente dejaba `total` contando aulas ajenas y escondía las propias de otras páginas.               |
| D18 | Las rutas `/aulas`, `/mis-clases` y `/mis-aulas` se registran en HU-206, con su estado vacío, antes de tener contenido     | §9     | Son destinos de la barra de navegación desde HU-206, y un enlace visible que cae en un 404 enseña al usuario a desconfiar de la navegación. HU-201, HU-203 y el Sprint 3 rellenan el contenido. |
| D19 | El diccionario visual de estados de aula vive en `components/dominio/estado-aula-variantes.ts`, separado de `<EstadoAula>` | §7.3   | El AC9 de HU-206 exigía verificar la regla del sólido, pero el componente es de HU-203. Separar la tabla visual del componente permite testear la regla antes de que exista quien la obedece.   |
| D20 | `<SessionBar>` desaparece: identidad y «Cerrar sesión» se absorben en la barra del shell                                   | §9     | Migrar las pantallas privadas al shell dejaba dos cabeceras apiladas. Un menú de avatar habría añadido estado oculto, que es justo lo que la navegación de HU-206 prohíbe.                      |

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

---

## 16. Registro de decisiones — Sprint 3 (2026-08-26)

| #   | Decisión                                                                                  | Dónde  | Por qué se tomó                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D28 | La **asistencia queda fuera del Sprint 3** y va al 4, con el historial                    | §4.6   | La HU-303 original la registraba al abrirse el enlace. La nota de auditoría #2 de la Definición ya había fijado que la asistencia es **manual del profesor**: con enlace manual de Zoom, un clic no prueba que nadie entrara. |
| D29 | Los avisos de reserva y cancelación **se emiten ya**, por el puerto `NotificationService` | §4.6   | El puerto existe desde HU-104 justo para esto. Insertar las llamadas ahora cuesta una línea por evento y se verifica con un espía; hacerlo en el Sprint 4 obliga a reabrir los servicios de reserva y cancelación.            |
| D30 | Un aula con reservas vivas **se puede cancelar, pero no mover de horario**                | HU-306 | El no solapamiento de §4.4 es del **estudiante**, no del aula: mover la clase puede chocar con otra que él ya reservó, sin que él haya hecho nada. Cancelar sí es legítimo y lo deja enterado, con su cupo libre.             |
| D31 | «Mis reservas» es **HU propia**, y va inmediatamente después de reservar                  | HU-302 | `/mis-clases` está registrada vacía desde HU-206 (D18) y ninguna HU antigua la llenaba. Reservar sin un sitio donde volver a encontrar lo reservado no es un sistema de reservas.                                             |

Correcciones aplicadas a las HUs del Sprint 3 al convertirlas, sin necesidad de decisión nueva:

- **HU-301** — la tarea de frontend pedía «actualización optimista», que contradice §4.2 y la
  regla 10 de `CLAUDE.md`. El cupo tiene concurrencia real y no se pinta reservado antes de que el
  servidor confirme.
- **HU-303 (antigua)** — planteaba un `GET /classrooms/:id/meeting-link` propio. Descartado por
  **D25**: el enlace se revela solo en `GET /classrooms/:id` y la regla vive en un único método.
  Pasa a ser HU-304 y **extiende `revelarElEnlace()`**, no crea endpoint.
- **HU-202** — el agujero que aquel sprint aplazó («notificar a los estudiantes con reserva salió
  del alcance: `Booking` no existe hasta el Sprint 3») se recoge en **HU-306**.
- **`ACCESS_WINDOW_MINUTES` y `CANCELLATION_WINDOW_MINUTES`** no existen todavía en
  `config/env.schema.ts`. Los añaden HU-304 y HU-303 respectivamente.

> **Deriva menor pendiente.** La tabla de §15 repite los números **D18, D19 y D20** en dos filas
> distintas. No afecta a ninguna regla —el texto de cada una es correcto— pero conviene renumerar
> las tres segundas ocurrencias antes de que alguien cite «D19» y no se sepa cuál.
