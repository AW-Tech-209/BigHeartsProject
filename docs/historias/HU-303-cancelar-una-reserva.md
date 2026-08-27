# HU-303 — Cancelar una reserva

| Campo               | Valor                                   |
| ------------------- | --------------------------------------- |
| **Sprint**          | Sprint 3 — Sistema de Reservas          |
| **Prioridad**       | 🟠 Alta                                 |
| **Estimación**      | 1.5 días                                |
| **Estado**          | ⬜ Pendiente                            |
| **Rama**            | `hu-303-cancelar-una-reserva-<persona>` |
| **Alcance técnico** | fullstack                               |
| **Depende de**      | HU-301, HU-302                          |
| **Labels**          | `sprint-3` `prioridad:alta` `fullstack` |

> **Como** estudiante,
> **Quiero** cancelar una reserva mía dentro del tiempo permitido,
> **Para** liberar el cupo si ya no puedo asistir y que otro lo tome.

## Contexto

La otra mitad de la invariante de cupos. Cancelar **decrementa `currentBookings` dentro de la
misma transacción** que marca la reserva `CANCELLED`. Si esas dos cosas se separan, el contador
queda mintiendo, y el contador es lo único que impide la sobreventa.

La fila **no se borra**: pasa a `CANCELLED` y se queda. El historial del Sprint 4 se construye
sobre ella, y el índice único parcial de HU-301 está diseñado justo para que cancelar no impida
volver a reservar.

La ventana es `CANCELLATION_WINDOW_MINUTES` (60 por defecto), y se decide **en el servidor**
contra el reloj de la BD. El frontend replica la cuenta solo para pintar; nunca para autorizar.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.3 (ventana, contador, la fila no se borra), §4.2 (transacción),
  §4.7 (el reloj del cliente no decide nada), §4.6 (aviso).
- **Skills:** `bighearts-backend` → `reglas-reservas.md` · `bighearts-ui` → `voz-microcopy.md`.
- **Reutiliza:** la transacción de HU-301 —es la misma, en sentido contrario—, el diálogo de
  confirmación de HU-202 (cancelar un aula), el puerto `NotificationService`.
- **Decisiones pendientes:** `CANCELLATION_WINDOW_MINUTES` **todavía no está en**
  `config/env.schema.ts`. Esta HU lo añade, validado con Zod como los demás.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: códigos `CANCELLATION_WINDOW_CLOSED`, `BOOKING_NOT_FOUND`
      (ver Notas de implementación), y el campo que dice si la reserva **todavía se puede cancelar**
      —para que el frontend pinte sin recalcular la regla—. Luego `npm run build:types`.

### Backend

- [x] **T2** — `CANCELLATION_WINDOW_MINUTES` en `config/env.schema.ts`, por defecto 60.
- [x] **T3** — `POST /bookings/:id/cancelar` con `@Roles('STUDENT')`: valida **propiedad de la
      reserva** y ventana, y en **una sola transacción** marca `CANCELLED`, escribe `cancelledAt` y
      decrementa `currentBookings`.
- [x] **T4** — Emitir `BOOKING_CANCELLED` por el puerto (D29).
- [x] **T5** — Tests: cancelar la reserva de otro → `404` (no `403`: no se confirma que exista);
      fuera de ventana → `CANCELLATION_WINDOW_CLOSED`; el contador baja exactamente uno; cancelar
      dos veces no lo baja dos veces; y **el cupo liberado se puede volver a reservar**.

### Frontend

- [x] **T6** — Acción de cancelar en «Mis reservas» y en el detalle, con confirmación accesible que
      diga **qué clase** se cancela. Sin optimismo: el estado cambia cuando responde el servidor.
- [x] **T7** — Pasada la ventana, la acción **no se ofrece** y en su lugar se explica por qué, con
      la hora límite en la zona del usuario. Nunca un botón muerto sin explicación.

## ✅ Criterios de aceptación

- [x] **AC1** — Dentro de la ventana, cancelar deja la reserva en `CANCELLED` con `cancelledAt`, y
      `currentBookings` baja **exactamente uno**. La fila no se borra.
- [x] **AC2** — El cupo liberado queda **inmediatamente** disponible: otro estudiante puede
      reservarlo acto seguido. Verificado con un test.
- [x] **AC3** — A 59 minutos del inicio la cancelación responde `CANCELLATION_WINDOW_CLOSED`; a 61
      minutos, `200`. La decisión es del servidor.
- [x] **AC4** — **Autorización:** cancelar la reserva de otro estudiante responde `404`, sin
      revelar que existe.
- [x] **AC5** — Cancelar dos veces la misma reserva **no** decrementa el contador dos veces.
- [x] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Que el profesor cancele la reserva de un estudiante.** No está decidido y no hace falta.
- **Cancelar el aula entera** → HU-306. Es otra cosa: la cancela el profesor y afecta a todos.
- **Penalizaciones** por cancelar tarde o a menudo. Fase posterior.
- El **email real**: sigue saliendo por `LoggingNotificationService` hasta el Sprint 4.

## Notas de implementación

`BOOKING_WINDOW_CLOSED`/`BOOKING_ALREADY_CANCELLED` de T1 se reemplazaron por
`CANCELLATION_WINDOW_CLOSED` (ya especificado en `reglas-reservas.md` §7 para este caso) y por
reutilizar `BOOKING_NOT_FOUND` en la doble cancelación — confirmado con el usuario antes de
implementar. `ClassroomListItem` gana `myBookingId`/`myBookingCancelable`; el catálogo general no
los rellena, así que la acción de cancelar solo aparece en «Mis reservas» y el detalle.
