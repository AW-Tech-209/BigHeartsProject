# HU-306 — Un aula con reservas no cambia en silencio

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Sprint 3 — Sistema de Reservas                   |
| **Prioridad**       | 🟠 Alta (cierra un agujero abierto desde HU-202) |
| **Estimación**      | 1.5 días                                         |
| **Estado**          | ⬜ Pendiente                                     |
| **Rama**            | `hu-306-un-aula-con-reservas-<persona>`          |
| **Alcance técnico** | fullstack                                        |
| **Depende de**      | HU-301, HU-303                                   |
| **Labels**          | `sprint-3` `prioridad:alta` `fullstack`          |

> **Como** estudiante con una clase reservada,
> **Quiero** que nadie pueda moverla ni borrarla sin que yo me entere,
> **Para** no presentarme a una videollamada que ya no existe.

## Contexto

**Este agujero se abre hoy, no existía ayer.** HU-202 —editar y cancelar un aula— se implementó en
el Sprint 2, cuando `Booking` no existía: cancelar un aula era gratis porque no había nadie dentro.
En cuanto HU-301 crea la primera reserva, ese mismo botón puede dejar a cinco estudiantes con una
clase fantasma y sin aviso. Está registrado como corrección de auditoría en `ARQUITECTURA.md` §15:
_«notificar a los estudiantes con reserva salió del alcance: `Booking` no existe hasta el Sprint
3»_. Esta es la HU que lo recoge.

### La decisión (D30)

**Cancelar el aula: sí. Mover el horario: no.**

Cancelar es legítimo —alguien se enferma— y el estudiante sale enterado, con su cupo liberado y
libre de reservar otra cosa. Mover la hora es distinto: cada estudiante ya reservado tiene su
propia agenda, y la regla de no solapamiento de §4.4 es **suya**, no del aula. Moverla a las 21:00
puede chocar con otra clase que él reservó, sin que él haya hecho nada. Validar contra todas las
agendas ajenas y decidir a quién se expulsa es un problema de producto mucho mayor que un `UPDATE`.

Así que con reservas `CONFIRMED` vivas, `scheduledAt` y `durationMinutes` **se bloquean**, con un
mensaje que dice la salida: cancelar y crear otra —duplicar el aula (HU-213) lo hace en un clic—.
Lo demás del aula (título, descripción, modos de comunicación, apoyos, enlace) **se sigue
editando**: nada de eso rompe la agenda de nadie, y prohibirlo sería castigar al profesor por tener
estudiantes.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.2 (el contador solo se toca en transacción), §4.3 (la fila no se
  borra), §4.4 (el no solapamiento es del estudiante), §4.6.
- **Skills:** `bighearts-backend` → `reglas-reservas.md` · `bighearts-ui` → `voz-microcopy.md` (el
  aviso tiene que decir la consecuencia, no solo pedir confirmación).
- **Reutiliza:** el flujo de editar y cancelar de HU-202 —esta HU **lo modifica**, no lo rehace—,
  la transacción de HU-303, el puerto `NotificationService`, el duplicado de HU-213.
- **Decisiones pendientes:** ninguna. D30 queda tomada aquí.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: código `CLASSROOM_HAS_BOOKINGS` y el recuento de reservas vivas
      en el aula propia, para que el formulario sepa qué bloquear. Luego `npm run build:types`.

### Backend

- [x] **T2** — En `PATCH /classrooms/:id`: si hay reservas `CONFIRMED`, rechazar los cambios de
      `scheduledAt` y `durationMinutes` con `CLASSROOM_HAS_BOOKINGS`. **El resto de campos sigue
      siendo editable.**
- [x] **T3** — En la cancelación del aula: **una sola transacción** que marca el aula `CANCELLED`,
      pasa todas sus reservas `CONFIRMED` a `CANCELLED` con `cancelledAt`, y deja
      `currentBookings` en 0. Las filas de reserva no se borran.
- [x] **T4** — Emitir `CLASSROOM_CANCELLED` por el puerto a **cada** estudiante afectado (D29). Un
      fallo de aviso **no deshace** la cancelación ya escrita: el puerto nunca lanza.
- [x] **T5** — Tests: mover el horario con reservas → `CLASSROOM_HAS_BOOKINGS`; sin reservas →
      `200`; editar el título con reservas → `200`; cancelar deja todo consistente; y **el cupo
      liberado no es reutilizable** porque el aula ya está cancelada.

### Frontend

- [x] **T6** — El formulario de editar **deshabilita fecha y duración** cuando hay reservas vivas y
      **explica por qué**, ofreciendo duplicar el aula como salida. Nunca un campo muerto sin
      motivo.
- [x] **T7** — El diálogo de cancelar dice **cuántos estudiantes** pierden su cupo y que se les
      avisará. Es la información que cambia la decisión.

## ✅ Criterios de aceptación

- [x] **AC1** — Con reservas `CONFIRMED` vivas, cambiar `scheduledAt` o `durationMinutes` responde
      `CLASSROOM_HAS_BOOKINGS`; cambiar título, descripción, modos o enlace responde `200`.
- [x] **AC2** — Sin reservas vivas, el horario se sigue editando como hasta ahora. Esta HU **no**
      rompe HU-202.
- [x] **AC3** — Al cancelar el aula, **todas** sus reservas `CONFIRMED` quedan `CANCELLED` con
      `cancelledAt`, `currentBookings` queda en 0, y **ninguna fila se borra**.
- [x] **AC4** — Se emite un aviso **por cada** estudiante afectado. Verificado con un espía en los
      tests.
- [x] **AC5** — El diálogo de cancelar dice cuántos estudiantes se quedan sin clase **antes** de
      confirmar, y el formulario de editar explica por qué la fecha está bloqueada.
- [x] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Reprogramar** un aula moviendo a sus estudiantes. Es lo que D30 descarta; si alguna vez se
  quiere, es una HU propia con su decisión de producto.
- **Que el admin cancele el aula de otro.** Sigue siendo solo lectura (HU-210, decisión 4).
- **Recolocar** automáticamente a los estudiantes en otra clase parecida. Fase posterior.
- **Compensaciones** o créditos por una clase cancelada. No hay pagos en Fase 1.

## Notas de implementación

Sin desviaciones. `currentBookings` ya era el recuento de reservas `CONFIRMED` vivas (§4.2), así que
T1 reutiliza ese campo en vez de añadir uno paralelo — solo se sumó el código de error y su
`details`.
