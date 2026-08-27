# HU-305 — El profesor ve quién viene a su clase

| Campo               | Valor                                          |
| ------------------- | ---------------------------------------------- |
| **Sprint**          | Sprint 3 — Sistema de Reservas                 |
| **Prioridad**       | 🟠 Alta                                        |
| **Estimación**      | 1.5 días                                       |
| **Estado**          | ⬜ Pendiente                                   |
| **Rama**            | `hu-305-el-profesor-ve-quien-viene-<persona>`  |
| **Alcance técnico** | fullstack                                      |
| **Depende de**      | HU-301                                         |
| **Labels**          | `sprint-3` `prioridad:alta` `fullstack` `a11y` |

> **Como** profesor,
> **Quiero** ver quiénes reservaron mi clase y **cómo se comunica cada uno**,
> **Para** preparar la sesión sabiendo a quién voy a tener delante.

## Contexto

En este producto esta pantalla no es administrativa: **es pedagógica**. Un profesor que sabe que
tres de sus cinco estudiantes siguen la clase en lengua de señas y uno por lectura labial prepara
una sesión distinta que uno que solo sabe que hay cinco. Esa es la diferencia que la plataforma
existe para producir, y sin ella el profesor sigue improvisando como en WhatsApp.

Por eso la lista lleva **el perfil de accesibilidad de cada estudiante** —preferencia de
comunicación y nivel de pérdida auditiva—, que hoy se recoge al registrarse y no lo ve nadie.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.8 (el alcance sale del token; el `meetingLink` no viaja en
  listados), §7.3.
- **Skills:** `bighearts-ui` → `layout-y-composicion.md` (**filas**, no tarjetas: se escanea para
  administrar) y `patrones-dominio.md` para pintar los modos de comunicación.
- **Reutiliza:** el detalle de aula de HU-204, la tabla de HU-210, los chips de modo de
  comunicación de HU-211, `CommunicationPreference` de `@academia/types`.
- **Decisiones pendientes:** ninguna.

> **Qué datos del estudiante se muestran.** Nombre, preferencia de comunicación, nivel de pérdida
> auditiva y estado de la reserva. **El email no.** El profesor no necesita escribirle a nadie por
> fuera: para eso está la plataforma, y exponer contactos abre una vía de contacto directo que
> nadie ha decidido abrir.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: el tipo del inscrito, con **solo** los campos de la nota de
      arriba. Luego `npm run build:types`.

### Backend

- [x] **T2** — `GET /classrooms/:id/inscritos` con `@Roles('TEACHER')`, **acotado al dueño**: si el
      aula no es suya, `404`.
- [x] **T3** — Devuelve las reservas `CONFIRMED` y `CANCELLED` por separado, con el perfil de
      accesibilidad de cada estudiante y el recuento sobre el cupo. **Sin email.**
- [x] **T4** — Tests: otro profesor → `404`; un `STUDENT` y un `ADMIN` → `403`; **el email no
      aparece** en la respuesta; los recuentos cuadran con `currentBookings`.

### Frontend

- [x] **T5** — Lista en **filas** dentro del detalle del aula propia, con nombre, modo de
      comunicación —color + ícono + texto—, nivel de pérdida auditiva y estado de la reserva.
- [x] **T6** — Un **resumen de accesibilidad del grupo** arriba: cuántos por cada modo. Es lo que
      el profesor mira antes de preparar; que no tenga que contarlo él.
- [x] **T7** — Los 4 estados. El vacío dice que aún no hay inscritos, sin sonar a error.

## ✅ Criterios de aceptación

- [x] **AC1** — El profesor dueño ve la lista completa de inscritos de su aula, con el estado de
      cada reserva y el recuento sobre el cupo.
- [x] **AC2** — Cada inscrito muestra **su modo de comunicación y su nivel de pérdida auditiva**, y
      arriba aparece el resumen del grupo por modo.
- [x] **AC3** — **Autorización:** otro profesor recibe `404`; un `STUDENT` y un `ADMIN`, `403`.
- [x] **AC4** — **El email del estudiante no aparece** en la respuesta. Verificado con un test.
- [x] **AC5** — Tras una cancelación, la lista y el recuento reflejan el cambio al volver a
      consultarla.
- [x] **AC6** — **Accesibilidad y verificación:** tabla con encabezados reales, recorrido con
      teclado, `axe` limpio, y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Marcar asistencia** → Sprint 4, con el historial. Es manual y es del profesor, pero sin
  historial donde consultarla no le sirve a nadie todavía.
- **Que el admin vea los inscritos.** No está decidido (HU-210, fuera de alcance).
- **Escribirle a un estudiante** desde aquí. Ninguna mensajería en Fase 1.
- **Exportar** la lista.

## Notas de implementación

Confirmados y cancelados se pintan en una sola tabla (columna «Reserva» los distingue); el resumen
de accesibilidad del grupo solo cuenta confirmados, porque es a quien el profesor prepara clase.
