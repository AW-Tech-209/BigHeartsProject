# HU-406 — El seed siembra historial y asistencia

| Campo               | Valor                                         |
| ------------------- | --------------------------------------------- |
| **Sprint**          | Sprint 4 — Notificaciones e Historial         |
| **Prioridad**       | 🟡 Media (sin esto no se demuestra el sprint) |
| **Estimación**      | 0.5 días                                      |
| **Estado**          | ✅ Hecho                                      |
| **Rama**            | `hu-406-seed-con-historial-<persona>`         |
| **Alcance técnico** | backend                                       |
| **Depende de**      | HU-403, HU-404                                |
| **Labels**          | `sprint-4` `prioridad:media` `backend`        |

> **Como** equipo,
> **Quiero** que el seed deje clases ya marcadas con asistencia,
> **Para** que el historial tenga algo que enseñar el día de la entrega.

## Contexto

Tercera vez que aparece esta HU, y ya es un patrón del proyecto: **lo que el seed no siembra, no se
puede demostrar.** HU-214 lo aprendió tarde —el Sprint 2 cerró con todo hecho y el catálogo vacío—,
HU-307 lo aplicó a tiempo, y esta lo cierra.

El historial es el caso más extremo de los tres. Una clase con asistencia marcada necesita: un aula
**pasada**, con reservas `CONFIRMED` encima, y un profesor que **ya pasó por la pantalla de
marcado**. A mano eso son varios minutos por fila y hay que esperar a que las clases terminen.
Sembrarlo cuesta unas líneas.

Y hay un detalle que solo se ve sembrando: `ATTENDED` y `NO_SHOW` **conviven en la misma clase**.
Una fila de historial donde todos asistieron no enseña que la pantalla distingue.

## Dependencias técnicas

- **Reutiliza** `apps/api/prisma/seed.ts` y su función pura `RESERVAS_DE_DEMOSTRACION`, que HU-307
  dejó calculando `currentBookings` desde las reservas — **no lo rompas escribiendo el contador a
  mano.**
- Fechas **relativas a `now()`**, nunca fijas. Convención desde HU-214.
- **`currentBookings` no cambia al marcar asistencia** (HU-403 AC4): una reserva `ATTENDED` sigue
  ocupando su cupo. Si el contador se descuadra al sembrar, el error está aquí.
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### Backend

- [x] **T1** — Al menos **dos aulas pasadas** con sus reservas ya marcadas, repartidas entre los dos
      profesores del seed.
- [x] **T2** — En una de ellas, **`ATTENDED` y `NO_SHOW` mezclados**, para que el historial del
      profesor enseñe inscritos y asistentes con números distintos.
- [x] **T3** — El estudiante del seed termina con las **tres salidas** en su historial: una a la que
      asistió, una a la que no, y una que canceló.
- [x] **T4** — Al menos una clase pasada **sin marcar**, que es el caso real más frecuente: el
      profesor todavía no ha pasado por ahí.
- [x] **T5** — `currentBookings` sigue cuadrando con las reservas que ocupan cupo, y el seed sigue
      siendo **idempotente**.

### Documentación

- [x] **T6** — Actualizar la descripción del seed en `README.md`.

## ✅ Criterios de aceptación

- [x] **AC1** — Tras `npm run db:seed`, el estudiante del seed ve en `/historial` **las tres
      salidas**: asistió, no asistió y canceló.
- [x] **AC2** — El profesor del seed ve en su historial al menos un aula donde **inscritos y
      asistentes son números distintos**.
- [x] **AC3** — Hay al menos una clase pasada **sin marcar**, y la pantalla de inscritos ofrece ahí
      la acción de marcar.
- [x] **AC4** — `currentBookings` de cada aula sigue cuadrando con sus reservas que ocupan cupo.
      Verificado con un test.
- [x] **AC5** — Ejecutar el seed dos veces **no duplica** nada ni descuadra ningún contador.
- [x] **AC6** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Sembrar correos enviados.** Las marcas de recordatorio se dejan vacías: el cron es quien las
  escribe, y falsearlas escondería si funciona.
- Datos de carga o rendimiento.
- Un seed distinto por entorno.

## Notas de implementación

`contarConfirmadasPorAula` pasó a `contarReservasConCupoPorAula`: `currentBookings` debe incluir
`ATTENDED`/`NO_SHOW` además de `CONFIRMED` (no solo esta última), porque marcar asistencia no libera
el cupo (HU-403 AC4). Dos aulas nuevas (`AULA_HISTORIAL_PROFE1/2`) sostienen el historial marcado.
