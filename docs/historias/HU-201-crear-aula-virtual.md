# HU-201 — Crear aula virtual con enlace de reunión manual

| Campo            | Valor                                             |
| ---------------- | ------------------------------------------------- |
| **Sprint**       | Sprint 2 — Gestión de Aulas                       |
| **Prioridad**    | 🔴 Crítica                                        |
| **Estimación**   | 4 días (3.5 originales + el servicio de cifrado)  |
| **Estado**       | ⬜ Pendiente                                      |
| **Rama**         | `hu-201-crear-aula-virtual-<persona>`             |
| **Colaboración** | Vertical slice compartido                         |
| **Depende de**   | HU-102, HU-104                                    |
| **Labels**       | `sprint-2` `prioridad:critica` `fullstack` `a11y` |

> **Como** profesor aprobado,
> **Quiero** crear un aula virtual con nombre, descripción, nivel, horario, duración, cupo máximo y
> el enlace de la reunión que yo mismo generé,
> **Para** ofrecer una clase controlada dentro de la plataforma sin depender de WhatsApp.

## Contexto

Es la primera pieza del ciclo de vida de una clase: sin aula no hay listado, ni reservas, ni
historial. Todo el Sprint 2 y el 3 se apoyan encima.

También es donde nace el dato más sensible del producto — el enlace de la videollamada — así que
esta HU fija cómo se guarda. Léela junto a `ARQUITECTURA.md` §4.1.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.1 (cifrado y ventana), §4.7 (`timestamptz` en
  UTC), §7.2 (modelo `Classroom`), §6.4 (variables de entorno).
- **Skills:** `bighearts-backend` → **lee `contrato-api.md`** (convenciones de Prisma y DTOs) ·
  `bighearts-ui` → **lee `voz-microcopy.md`** (fechas, ayudas contextuales, errores).
- **Bloquea a:** HU-104 debe estar cerrada. Sin un profesor `ACTIVE` no hay quien cree un aula.
- **⚠️ El decorador `@Roles` lo crea HU-104.** Si esta HU empieza antes, créalo aquí y avisa.

### Decisiones de auditoría (2026-08-18)

**1. El aula nace `PUBLISHED`, no `DRAFT`.** Crear un aula debe costar menos que abrir un grupo de
WhatsApp; un paso extra de publicación es fricción sin beneficio en Fase 1. `DRAFT` se queda en el
enum sin escritor, reservado para Fase 1.5.

**2. `currentBookings` entra en el modelo desde ya**, con valor `0`. Sprint 2 no lo mueve, pero
`ARQUITECTURA.md` §4.2 lo exige para la transacción de cupos del Sprint 3, y añadirlo después
sería otra migración. **En este sprint nadie lo modifica.**

**3. El cifrado es AES-256-GCM con `MEETING_LINK_KEY`**, del módulo `crypto` de Node. Sin
dependencias nuevas ni extensiones de PostgreSQL.

**4. `isRecurring` existe como columna y nada más.** Cero lógica de recurrencia en Fase 1
(`DEFINICION_PROYECTO.md` §5.2). No construyas series ni instancias.

## 🤝 Task de contrato — va primero

- [ ] **T0** — En `packages/types`: enums `EnglishLevel` (`BEGINNER | INTERMEDIATE | ADVANCED`),
      `ClassroomStatus` (`DRAFT | PUBLISHED | CANCELLED | COMPLETED`) y `MeetingProvider`;
      `CreateClassroomInput`; el tipo `Classroom` **sin `meetingLink`** por defecto (mismo patrón
      que `User` sin `password`), con el enlace como campo opcional que **se omite** cuando no
      aplica; y los códigos de error nuevos. Enums espejo en `schema.prisma`, mismo commit.

## 🔧 Tasks — Dev A (backend)

- [ ] **A1** — Modelo `Classroom` en Prisma: `teacherId`, `title`, `description`, `level`,
      `maxStudents`, **`currentBookings` (default 0)**, `scheduledAt` (**`timestamptz`**),
      `durationMinutes`, `meetingLink`, `meetingProvider`, `status`, `isRecurring`, timestamps.
      Índices por `teacherId` y por `(status, scheduledAt)`. Migración versionada.
- [ ] **A2** — `MEETING_LINK_KEY` en `config/env.schema.ts` (obligatoria, sin default, longitud
      validada) **y** en `.env.example`. Sin ella la app no arranca — igual que con `JWT_SECRET`.
- [ ] **A3** — Servicio de cifrado AES-256-GCM (`crypto` de Node) que guarde IV + tag +
      ciphertext. Con tests de ida y vuelta y de manipulación del tag.
- [ ] **A4** — `POST /classrooms` con `@Roles('TEACHER')`. `teacherId` sale **del token**, nunca
      del cuerpo. `status` nace `PUBLISHED`, `currentBookings` en `0`, `meetingProvider` en
      `MANUAL`.
- [ ] **A5** — El profesor debe estar `ACTIVE`. Un `TEACHER` con `PENDING` o `REJECTED` recibe
      `403`, no un aula creada.
- [ ] **A6** — `CreateClassroomDto` con `class-validator`: `scheduledAt` futuro, `maxStudents > 0`,
      `durationMinutes > 0`, `meetingLink` con formato de URL, `title` no vacío.
- [ ] **A7** — Tests: creación correcta, cada validación, autorización por rol y por estado.

## 🔧 Tasks — Dev B (frontend)

- [ ] **B1** — `features/aulas/` con `api/`, `components/`, `hooks/`, `lib/`.
- [ ] **B2** — Formulario accesible: `<label>` visible en todos los campos, error junto al campo
      con `aria-invalid` + `aria-describedby` + ícono, y los 4 estados.
- [ ] **B3** — Campo de enlace con ayuda contextual permanente:
      `Pega aquí el enlace de la reunión que creaste en Zoom o Meet.` Explica también que los
      estudiantes solo lo verán 30 minutos antes — es la promesa central del producto y el profesor
      debe entenderla al pegarlo.
- [ ] **B4** — Selectores de nivel, fecha, hora y duración operables **solo con teclado**. Nada de
      date-pickers que exijan ratón.
- [ ] **B5** — La fecha elegida se confirma en texto completo con zona explícita antes de enviar:
      `Martes 12 de agosto, 6:00 p. m. (hora de Colombia)`.
- [ ] **B6** — Éxito: anunciar por `aria-live` y redirigir al detalle del aula (HU-204).

## ✅ Criterios de aceptación

- [ ] **AC1** — Un profesor `ACTIVE` crea un aula y la respuesta es `201`, con `teacherId` igual al
      usuario del token, `status = PUBLISHED` y `currentBookings = 0`.
- [ ] **AC2** — **El enlace no es legible en la base de datos.** Consultando la columna
      directamente se obtiene texto cifrado, no la URL. Verificado con un test.
- [ ] **AC3** — Enviar `teacherId` en el cuerpo no tiene ningún efecto: el aula se asigna siempre
      al usuario del token.
- [ ] **AC4** — **Validaciones:** `scheduledAt` en el pasado, `maxStudents ≤ 0`,
      `durationMinutes ≤ 0` o `meetingLink` sin formato de URL responden `VALIDATION_ERROR` con
      `details.fields[]`, y el formulario pinta el error bajo el campo correspondiente.
- [ ] **AC5** — **Autorización:** un `STUDENT` recibe `403`. Un `TEACHER` con estado `PENDING` o
      `REJECTED` también recibe `403`.
- [ ] **AC6** — **Tiempo:** `scheduledAt` se persiste en UTC, y la interfaz lo muestra en la zona
      del usuario con la zona nombrada de forma explícita.
- [ ] **AC7** — La app **no arranca** si falta `MEETING_LINK_KEY`, y el mensaje dice cuál falta.
- [ ] **AC8** — **Accesibilidad:** el formulario completo se rellena y se envía solo con teclado,
      con foco visible; funciona en `.dark` y `.hc`; cumple el checklist del skill `bighearts-ui`.
- [ ] **AC9** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde.

## 🚫 Fuera de alcance

- **Recurrencia.** `isRecurring` es una columna sin lógica. Fase 1.5.
- **Generación automática del enlace** (Daily.co, Meet API). Fase 1.5.
- Publicar y despublicar: el aula nace `PUBLISHED` y no hay flujo de borrador.
- Editar o cancelar el aula → HU-202.
- Mostrar el enlace a estudiantes y la ventana de 30 minutos → HU-303.
- Subir materiales o adjuntos al aula.

## Notas de implementación

_Se rellena al cerrar._
