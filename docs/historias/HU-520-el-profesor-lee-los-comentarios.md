# HU-520 — El profesor lee lo que escribieron sus estudiantes

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                                  |
| **Prioridad**       | 🟠 Alta                                           |
| **Estimación**      | 1 día                                             |
| **Estado**          | ⬜ Pendiente                                      |
| **Asignada a**      | **Dev A** (T1–T2) · **Dev B** (T3–T5)             |
| **Rama**            | `hu-520-el-profesor-lee-los-comentarios-a` / `-b` |
| **Alcance técnico** | fullstack                                         |
| **Depende de**      | HU-515                                            |
| **Labels**          | `post-fase-1` `prioridad:alta` `fullstack`        |

> **Como** profesor que acaba de dar una clase,
> **quiero** leer los comentarios que dejaron mis estudiantes al valorarla, además de los conteos,
> **para** saber qué cambiar en la próxima sin esperar a que el admin me lo cuente.

## Contexto

HU-515 le da al profesor los **conteos** («6 sí · 2 a medias») y los problemas más citados de cada
clase, pero los **comentarios** solo llegan al admin (HU-516). Y es justo el comentario lo que dice
qué arreglar. Se amplía D47 (**D47.1**): el profesor dueño también lee los comentarios, **con la
misma protección**: sin autor ni fecha, en orden aleatorio, y solo cuando la clase tiene ≥
`VALORACION_MINIMO_RESPUESTAS` respuestas.

## Referencias

- **Archivos a tocar:** `packages/types/src/index.ts` (tipo de la valoración del profesor),
  `apps/api/src/bookings/valoracion.rules.ts`, `apps/api/src/historial/historial.service.ts`,
  `apps/api/src/classrooms/classrooms.service.ts` + `classroom.mapper.ts` (detalle),
  `apps/web/src/features/historial/components/tabla-historial-profesor.tsx`,
  `apps/web/src/pages/AulaDetallePage.tsx`, `apps/web/src/features/valoracion/`.
- **Reglas:** `ARQUITECTURA.md` → «4.8 Visibilidad y acciones por rol» y la entrada de D47.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — `valoracion.rules.ts`: el agregado del profesor suma `comentarios: string[]`, sin autor
      ni fecha, **barajado** (no por orden de llegada, para que no se pueda cruzar con quién salió
      primero). Sigue siendo `null` por debajo del mínimo.
- [ ] **T2** — El mismo agregado viaja en `GET /classrooms/:id` **solo al profesor dueño**, y solo si
      la clase terminó. Al resto de roles, el campo no viaja (como el enlace).
- [ ] **T3** — Historial del profesor: en cada aula con valoración, un desplegable «Lo que escribieron
      tus estudiantes (N)» con los comentarios en citas (`<blockquote>`).
- [ ] **T4** — Detalle de una clase terminada, para el dueño: la sección «Cómo la vivieron tus
      estudiantes» con conteos, problemas y comentarios. Con `null`: «Aún no hay suficientes
      respuestas para mostrar (mínimo 3)».
- [ ] **T5** — Tests: otro profesor y el estudiante no reciben el campo; con 2 respuestas es `null`;
      con 3 llegan los comentarios sin id ni fecha; `axe` en la sección.

## Criterios de aceptación

- [ ] **AC1** — El profesor dueño ve los comentarios de su clase en el historial y en el detalle de
      la clase terminada.
- [ ] **AC2** — Ningún objeto de comentario que llega al profesor tiene id, fecha, `bookingId` ni
      datos del estudiante: es un `string` suelto (verificado en el test del mapper).
- [ ] **AC3** — Con menos respuestas que el mínimo no llega ni un comentario, aunque existan.
- [ ] **AC4** — Otro profesor, un estudiante y un aula todavía sin terminar: el campo no viaja en
      `GET /classrooms/:id`.
- [ ] **AC5** — La tarjeta de valorar del estudiante dice «Tu profesor lo leerá sin tu nombre».

## Fuera de alcance

- Que el profesor responda un comentario. No es un chat.
- Moderación u ocultar comentarios.

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
