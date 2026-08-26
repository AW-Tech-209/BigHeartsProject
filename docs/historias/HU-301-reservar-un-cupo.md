# HU-301 — Reservar un cupo

| Campo               | Valor                                      |
| ------------------- | ------------------------------------------ |
| **Sprint**          | Sprint 3 — Sistema de Reservas             |
| **Prioridad**       | 🔴 Crítica (núcleo del producto)           |
| **Estimación**      | 3 días                                     |
| **Estado**          | ⬜ Pendiente                               |
| **Rama**            | `hu-301-reservar-un-cupo-<persona>`        |
| **Alcance técnico** | fullstack                                  |
| **Depende de**      | HU-204 (✅)                                |
| **Labels**          | `sprint-3` `prioridad:critica` `fullstack` |

> **Como** estudiante,
> **Quiero** reservar un cupo en un aula disponible,
> **Para** asegurar mi lugar sin escribirle a nadie por WhatsApp.

## Contexto

Es la HU más crítica de la Fase 1 y la única con concurrencia real. Todo lo que el Sprint 2
construyó —catálogo, detalle, estados, cupos— existe para llegar aquí.

`Booking` **no existe todavía**. Esta HU lo crea, y con él se vuelven alcanzables por primera vez
los estados `reservada` y `acceso-abierto` de `derivarEstadoAula()`, que hoy son código muerto.

La transacción está escrita entera en `ARQUITECTURA.md` §4.2. **No la reinventes: cópiala.** Las
tres reglas —cupo, reserva duplicada, solapamiento— se validan **dentro** de la transacción.
Comprobarlas antes deja la carrera abierta, que es exactamente el fallo que esta HU existe para no
tener.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.2 (transacción y contador), §4.3 (índice único **parcial**),
  §4.4 (no solapamiento del estudiante), §4.8 regla 1 (**solo `STUDENT` reserva**), §7.3.
- **Skills:** `bighearts-backend` → `reglas-reservas.md` · `bighearts-ui`.
- **Reutiliza:** `derivarEstadoAula()` de `@academia/types` —ya contempla `myBookingStatus`, solo
  hay que empezar a enviarlo—, `currentBookings` de `Classroom` (existe desde HU-201, nadie lo ha
  movido nunca), y el detalle de aula de HU-204.
- **Decisiones pendientes:** ninguna.

> **Sin mutaciones optimistas.** `CLAUDE.md` regla 10 y el skill de UI. El cupo tiene concurrencia
> real: no se pinta «reservado» hasta que el servidor lo confirma. Es la única pantalla del
> producto donde esto importa de verdad.

## 🔧 Tasks

### Contrato — va primero

- [ ] **T1** — En `packages/types`: `BookingStatus`, el tipo de reserva, `myBookingStatus` en el
      detalle de aula, y los códigos `CLASSROOM_FULL`, `ALREADY_BOOKED`, `BOOKING_TIME_CONFLICT`,
      `CLASSROOM_NOT_BOOKABLE`. Luego `npm run build:types`.

### Backend

- [ ] **T2** — Modelo `Booking` en Prisma + migración: `studentId`, `classroomId`, `status`,
      `cancelledAt`, marcas de recordatorio (columnas para §4.6, **sin lógica**, igual que se hizo
      con `currentBookings`). Índice único **parcial** `WHERE status = 'CONFIRMED'` — el total
      impediría volver a reservar tras cancelar.
- [ ] **T3** — `POST /bookings` con `@Roles('STUDENT')`, dentro de la transacción de §4.2 con
      `SELECT … FOR UPDATE` sobre el aula. Las tres validaciones van **dentro**.
- [ ] **T4** — No se reserva un aula `CANCELLED`, ni una que ya empezó → `CLASSROOM_NOT_BOOKABLE`.
- [ ] **T5** — Emitir `BOOKING_CONFIRMED` por el puerto `NotificationService` (D29). Añade el tipo
      al puerto; **no toques la firma** ni el adaptador.
- [ ] **T6** — Tests: **concurrencia real** (dos transacciones simultáneas por el último cupo),
      reserva duplicada, solapamiento, aula cancelada, y `403` para `TEACHER` y `ADMIN`.

### Frontend

- [ ] **T7** — Botón de reservar en el detalle del aula, solo para `STUDENT` y solo si el estado lo
      permite. Confirmación accesible, los 4 estados, **sin optimismo**, y cada código de error con
      su mensaje literal. Al confirmar, se re-consulta el aula.

## ✅ Criterios de aceptación

- [ ] **AC1** — **Concurrencia:** dos estudiantes pidiendo el último cupo a la vez → exactamente
      uno recibe `201` y el otro `409 CLASSROOM_FULL`; `currentBookings` queda **igual** a
      `maxStudents`, nunca por encima. Verificado con un test de transacciones simultáneas.
- [ ] **AC2** — Un estudiante con reserva `CONFIRMED` en esa aula recibe `ALREADY_BOOKED`; con una
      reserva que se solapa en horario, `BOOKING_TIME_CONFLICT`. Una clase que termina a las 18:00
      y otra que empieza a las 18:00 **no** se solapan.
- [ ] **AC3** — Quien canceló **puede volver a reservar** la misma aula si hay cupo.
- [ ] **AC4** — **Autorización:** `TEACHER` y `ADMIN` reciben `403` en `POST /bookings`, y **no ven
      el botón** — no se pinta deshabilitado, no se pinta.
- [ ] **AC5** — La interfaz **no** muestra el aula como reservada antes de la respuesta del
      servidor, y tras reservar el estado pasa a `reservada` con color + ícono + texto.
- [ ] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Cancelar** una reserva → HU-303.
- **«Mis reservas»** → HU-302. Esta HU deja al estudiante en el detalle del aula.
- **El enlace de la videollamada** → HU-304. Aquí no cambia nada de §4.1.
- **Lista de espera** cuando no hay cupo. No está en el alcance de la Fase 1.
- **Recordatorios** con cron → Sprint 4. Esta HU solo crea las columnas.

## Notas de implementación

_Se rellena al cerrar._
