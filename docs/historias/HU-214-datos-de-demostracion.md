# HU-214 — Datos de demostración en el seed

| Campo               | Valor                                    |
| ------------------- | ---------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas              |
| **Prioridad**       | 🔴 Crítica (bloquea la demo al cliente)  |
| **Estimación**      | 0.5 días                                 |
| **Estado**          | ⬜ Pendiente                             |
| **Rama**            | `hu-214-datos-de-demostracion-<persona>` |
| **Alcance técnico** | backend                                  |
| **Depende de**      | HU-211 (✅), HU-212 (✅)                 |
| **Labels**          | `sprint-2` `prioridad:critica` `backend` |

> **Como** equipo,
> **Quiero** que el seed cree aulas de ejemplo además de los usuarios,
> **Para** poder enseñarle el Sprint 2 al cliente sin construir los datos a mano cada vez.

## Contexto

El seed crea **tres usuarios y ninguna aula**. Todo el Sprint 2 es gestión de aulas: catálogo,
filtros, estados, coincidencia de accesibilidad, supervisión. **Hoy no hay nada que enseñar** sin
crear cada aula a mano por la interfaz, y hay estados que ni siquiera se pueden alcanzar así en un
rato razonable (una clase pasada, una llena, una cancelada).

También bloquea la verificación: los AC de HU-203, HU-208, HU-210 y HU-211 hablan de filtros y
estados que necesitan varias aulas distintas para comprobarse.

## Dependencias técnicas

- **Reutiliza** `apps/api/prisma/seed.ts`, que ya es idempotente por `upsert`.
- El seed **puede escribir `currentBookings` directamente**: no hay `Booking` hasta Sprint 3, y es
  la única forma de alcanzar «últimos cupos» y «sin cupos» para la demo.
- Las fechas se calculan **relativas a `now()`**, nunca fijas: un seed con fechas absolutas caduca.

## 🔧 Tasks

### Backend

- [x] **T1** — Segundo profesor `ACTIVE` en el seed. Con uno solo no se puede enseñar la supervisión
      del admin ni el distintivo `Tu clase` del catálogo.
- [x] **T2** — Un profesor `PENDING`, para que el panel del admin tenga algo que aprobar.
- [x] **T3** — **Ocho aulas** repartidas entre los dos profesores, con fechas relativas a `now()`,
      que cubran: `disponible`, `últimos cupos`, `sin cupos`, `en curso`, `finalizada` (pasada),
      `cancelada`, y una **sin modos de comunicación declarados**.
- [x] **T4** — Variar `level` y `communicationModes` entre ellas para que los filtros del catálogo y
      la marca `Coincide con tu preferencia` se puedan probar de verdad.
- [x] **T5** — Dar al estudiante del seed una `communicationPreference` que **coincida con algunas
      aulas y no con otras**.
- [x] **T6** — Mantener la idempotencia: re-ejecutar el seed no duplica aulas.

### Documentación

- [x] **T7** — Actualizar `README.md`, que dice «el seed crea un usuario por rol»: ahora también
      siembra aulas de ejemplo.

## ✅ Criterios de aceptación

- [x] **AC1** — Tras `npm run db:seed`, el catálogo muestra **al menos cinco aulas** de dos
      profesores distintos.
- [x] **AC2** — Entre las sembradas se pueden ver **al menos cinco de los nueve estados** de
      `<EstadoAula>`, incluidos «sin cupos» y «cancelada».
- [x] **AC3** — El estudiante del seed ve **algunas aulas marcadas** con `Coincide con tu
preferencia` y otras sin marcar.
- [x] **AC4** — Hay **al menos un aula sin modos declarados**, que se muestra como
      `Modo sin indicar`.
- [x] **AC5** — El panel del admin tiene **un profesor pendiente** que aprobar, y la supervisión
      lista aulas de los dos profesores.
- [x] **AC6** — Ejecutar el seed dos veces seguidas **no duplica** nada, y ninguna fecha sembrada
      queda en el pasado por ser absoluta.

## 🚫 Fuera de alcance

- Reservas: no existe `Booking` hasta Sprint 3. `currentBookings` se escribe directo.
- Datos de carga o rendimiento.
- Seed distinto por entorno: el mismo sirve para local y staging.

## Notas de implementación

Las aulas se upsertean por un id UUID **fijo** (no hay campo de negocio único en `Classroom`), y en
el `update` se recalculan también las fechas — así una fila reejecutada nunca queda con
`scheduledAt` obsoleto. `reservada`, `acceso-abierto` y `pendiente-aprobacion` no se sembraron:
hoy no tienen ningún caso alcanzable (no existe `Booking`, y no hay forma de que un profesor
`PENDING` tenga aulas), tal y como documenta `derivarEstadoAula()`.
