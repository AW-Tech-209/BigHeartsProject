# HU-104 — Aprobación de profesores por el administrador

| Campo            | Valor                                                     |
| ---------------- | --------------------------------------------------------- |
| **Sprint**       | Sprint 1 — Autenticación y Usuarios                       |
| **Prioridad**    | 🟠 Alta                                                   |
| **Estimación**   | 3 días (2.5 originales + el guard de rol, que no existía) |
| **Estado**       | ⬜ Pendiente                                              |
| **Rama**         | `hu-104-aprobacion-de-profesores-<persona>`               |
| **Colaboración** | Paralelo con contrato acordado                            |
| **Depende de**   | HU-101, HU-102                                            |
| **Labels**       | `sprint-1` `prioridad:alta` `fullstack`                   |

> **Como** administrador,
> **Quiero** ver los profesores pendientes y aprobar o rechazar su registro,
> **Para** controlar quién puede crear aulas en la plataforma.

## Contexto

`TEACHER_APPROVAL_REQUIRED` está activo por defecto, así que desde HU-101 todo profesor nace
`PENDING` y su login responde `ACCOUNT_PENDING`. **Hoy no existe forma de sacarlo de ahí:** los
profesores registrados están bloqueados de forma permanente.

Esto convierte la HU en el cuello de botella del Sprint 2 — sin aprobación no hay ningún profesor
`ACTIVE` que pueda crear un aula en HU-201.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.5 (registro y aprobación), §8 (autorización
  siempre en el servidor), §6.3 (envelope y códigos de error).
- **Skills:** `bighearts-backend` (guards, DTOs, contrato) · `bighearts-ui` (tabla accesible,
  acciones destructivas, microcopy).
- **⚠️ El decorador `@Roles` NO existe.** `apps/api/src/auth/decorators/` solo tiene
  `current-user.decorator.ts` y `public.decorator.ts`. Crearlo es parte de esta HU, y **HU-201 lo
  necesita después** — trátalo como infraestructura, no como detalle de este endpoint.

### Decisiones de auditoría (2026-08-18)

**1. Rechazar usa un estado nuevo `REJECTED`, no `SUSPENDED`.** `SUSPENDED` significa "cuenta
deshabilitada por un administrador"; un profesor rechazado nunca estuvo activo. Reusarlo obligaría
a decirle "tu cuenta fue suspendida", que es falso — y el microcopy de este producto es
deliberadamente literal. Cuesta una migración y un código de error.

**2. El email es un puerto con adaptador de registro, no un envío real.** No hay proveedor de email
en el repo y `NotificationsModule` es un `@Module({})` vacío. Esta HU define la **interfaz**
`NotificationService` y una implementación `LoggingNotificationService` que registra el envío de
forma estructurada. El adaptador real (proveedor, plantillas, reintentos) es trabajo del Sprint 4 y
**sustituye la implementación sin tocar quien la llama**. Así el AC es verificable hoy con un
espía en los tests, y el cableado no hay que rehacerlo.

## 🤝 Task de contrato — va primero

- [ ] **T0** — En `packages/types`: añadir `REJECTED` a `UserStatus`, el código
      `ACCOUNT_REJECTED` y `INVALID_STATUS_TRANSITION` a `ApiErrorCode`, y el tipo de respuesta del
      listado de pendientes. Añadir `REJECTED` **también** al enum de `schema.prisma` en el mismo
      commit — los dos enums se cambian juntos. Luego `npm run build:types`.

## 🔧 Tasks — Dev A (backend)

- [ ] **A1** — Decorador `@Roles(...)` + guard de rol en `auth/`, componible con el guard de
      autenticación global. Con sus tests.
- [ ] **A2** — Migración de Prisma que añade `REJECTED` a `UserStatus`.
- [ ] **A3** — `AdminModule`: `GET /admin/teachers/pending` — solo usuarios con `role = TEACHER` y
      `status = PENDING`, ordenados por `createdAt`.
- [ ] **A4** — `POST /admin/teachers/:id/approve` → `ACTIVE` · `POST /admin/teachers/:id/reject` →
      `REJECTED`. Los tres endpoints con `@Roles('ADMIN')`.
- [ ] **A5** — Validar la transición: el objetivo debe existir, ser `TEACHER` y estar `PENDING`. En
      cualquier otro caso, `INVALID_STATUS_TRANSITION`.
- [ ] **A6** — `NotificationsModule`: interfaz `NotificationService` + `LoggingNotificationService`
      que registra destinatario, tipo de evento y resultado. Documentar en el módulo que el
      adaptador real llega en Sprint 4.
- [ ] **A7** — Login de un usuario `REJECTED` responde `ACCOUNT_REJECTED`, distinto de
      `ACCOUNT_SUSPENDED`.
- [ ] **A8** — Tests: autorización (403 para `STUDENT` y `TEACHER`), transiciones inválidas,
      y que la notificación se dispara con los datos correctos.

## 🔧 Tasks — Dev B (frontend)

- [ ] **B1** — `features/admin/` con `api/`, `hooks/`, `components/`.
- [ ] **B2** — Ruta `/admin` envuelta en `<RequireAuth roles={[UserRole.ADMIN]}>` (el
      `role-gate.tsx` ya existe; no dupliques la lógica).
- [ ] **B3** — Tabla accesible de profesores pendientes: `<caption>`, encabezados reales, y las
      acciones como `<button>`, nunca `<div onClick>`.
- [ ] **B4** — Confirmación con `AlertDialog` **con verbos** (`Aprobar profesor` / `Volver`), nunca
      Sí/No. El rechazo es destructivo: usa `destructive` y advierte que el profesor no podrá
      entrar.
- [ ] **B5** — Tras la acción: invalidar la query de pendientes y anunciar el resultado por
      `aria-live="polite"` con `useAnnounce`.
- [ ] **B6** — Los 4 estados: cargando, **vacío** (`No hay profesores esperando aprobación.`),
      error y éxito.

## ✅ Criterios de aceptación

- [ ] **AC1** — `GET /admin/teachers/pending` devuelve **solo** usuarios con `role = TEACHER` y
      `status = PENDING`. Un estudiante `PENDING` o un profesor `ACTIVE` no aparecen.
- [ ] **AC2** — Aprobar cambia el `status` a `ACTIVE`, y ese mismo profesor —que antes recibía
      `ACCOUNT_PENDING`— consigue iniciar sesión.
- [ ] **AC3** — Rechazar cambia el `status` a `REJECTED`, y su login responde `ACCOUNT_REJECTED`
      con un mensaje distinto del de una cuenta suspendida.
- [ ] **AC4** — **Autorización:** un `STUDENT` y un `TEACHER` reciben `403` en los tres endpoints.
      Verificado con tests de backend, no ocultando la UI.
- [ ] **AC5** — Aprobar a alguien que no es `TEACHER`, que ya está `ACTIVE`, o cuyo `id` no existe,
      responde `INVALID_STATUS_TRANSITION` o `USER_NOT_FOUND` — nunca un 500.
- [ ] **AC6** — **Notificación:** aprobar y rechazar invocan `NotificationService` con el
      destinatario y el tipo de evento correctos. Verificado con un espía en los tests. El envío
      real no forma parte de esta HU.
- [ ] **AC7** — **Accesibilidad:** la tabla se recorre entera con teclado con foco visible, el
      diálogo de confirmación atrapa el foco y se cierra con `Esc`, y el resultado de la acción se
      anuncia por región `aria-live`. Cumple el checklist del skill `bighearts-ui`.
- [ ] **AC8** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde.

## 🚫 Fuera de alcance

- **Envío real de email.** Solo el puerto y el adaptador de registro. El proveedor, las plantillas
  y los reintentos son del Sprint 4.
- Reactivar a un profesor `REJECTED` o `SUSPENDED` (HU propia de back-office).
- Listado o gestión de estudiantes.
- Motivo del rechazo en texto libre.
- Que el profesor vea el estado de su solicitud dentro de la plataforma (hoy solo lo sabe al
  intentar entrar).

## Notas de implementación

_Se rellena al cerrar._
