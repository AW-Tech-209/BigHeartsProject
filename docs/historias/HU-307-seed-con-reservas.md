# HU-307 — El seed siembra reservas

| Campo               | Valor                                                 |
| ------------------- | ----------------------------------------------------- |
| **Sprint**          | Sprint 3 — Sistema de Reservas                        |
| **Prioridad**       | 🟡 Media (cierra el sprint: sin esto no se demuestra) |
| **Estimación**      | 0.5 días                                              |
| **Estado**          | ⬜ Pendiente                                          |
| **Rama**            | `hu-307-seed-con-reservas-<persona>`                  |
| **Alcance técnico** | backend                                               |
| **Depende de**      | HU-301, HU-303, HU-304                                |
| **Labels**          | `sprint-3` `prioridad:media` `backend`                |

> **Como** equipo,
> **Quiero** que el seed cree reservas además de aulas,
> **Para** poder enseñar el sistema de reservas sin fabricar el escenario a mano cada vez.

## Contexto

Misma lección que HU-214, aplicada a tiempo. Aquel sprint terminó con todo implementado y nada que
enseñar porque el seed no creaba aulas; **esta HU evita repetirlo**, y por eso se planifica desde
el principio en vez de descubrirse al cerrar.

Hay tres estados de `derivarEstadoAula()` que **HU-214 no pudo sembrar** porque `Booking` no
existía: `reservada`, `acceso-abierto` y —para el escenario completo— una clase a punto de empezar
con el enlace ya visible. Son justo los que demuestran que el producto funciona.

Y el escenario que más cuesta montar a mano: **un aula con el último cupo libre**, para enseñar la
concurrencia sin cronometrar dos navegadores.

## Dependencias técnicas

- **Reutiliza** `apps/api/prisma/seed.ts`, ya idempotente por `upsert` con ids fijos (HU-214).
- **`currentBookings` debe cuadrar con las reservas sembradas.** Es la única invariante del
  producto que un seed puede romper en silencio: si el contador y las filas no coinciden, la
  concurrencia funciona pero parece rota.
- Fechas **relativas a `now()`**, nunca fijas. Ya es la convención de HU-214.
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### Backend

- [ ] **T1** — Un **segundo estudiante** en el seed, con preferencia de comunicación distinta a la
      del primero: sin dos, la lista de inscritos de HU-305 no enseña nada y el resumen del grupo
      es una sola barra.
- [ ] **T2** — Reservas `CONFIRMED` que dejen al estudiante del seed con: una clase **próxima**,
      una **a punto de empezar** —dentro de la ventana de acceso, con el enlace visible— y una
      **pasada**.
- [ ] **T3** — Una reserva `CANCELLED` con su `cancelledAt`, para que el filtro `canceladas` de
      «Mis reservas» tenga contenido y se vea que la fila no se borra.
- [ ] **T4** — Un aula **con el último cupo libre** (`currentBookings = maxStudents − 1`) y otra
      **llena**, ambas con reservas reales detrás.
- [ ] **T5** — Un aula con **inscritos de modos de comunicación distintos**, para HU-305.
- [ ] **T6** — **`currentBookings` de cada aula cuadra exactamente** con sus reservas `CONFIRMED`.
      Y el seed sigue siendo idempotente: reejecutarlo no duplica ni descuadra el contador.

### Documentación

- [ ] **T7** — Actualizar la descripción del seed en `README.md`.

## ✅ Criterios de aceptación

- [ ] **AC1** — Tras `npm run db:seed`, el estudiante del seed ve en `/mis-clases` una clase
      próxima, una pasada y una cancelada, cada una en su filtro.
- [ ] **AC2** — Una de sus clases está **dentro de la ventana de acceso**: el botón de entrar está
      visible sin esperar.
- [ ] **AC3** — Existe un aula con **exactamente un cupo libre** y otra **llena**, y el catálogo
      las muestra como `ultimos-cupos` y `llena`.
- [ ] **AC4** — En **toda** aula sembrada, `currentBookings` es igual al número de sus reservas
      `CONFIRMED`. Verificado con un test, no a ojo.
- [ ] **AC5** — El profesor del seed ve en su aula una lista de inscritos con **al menos dos modos
      de comunicación distintos**.
- [ ] **AC6** — Ejecutar el seed dos veces **no duplica** reservas ni descuadra ningún contador.

## 🚫 Fuera de alcance

- Datos de carga o rendimiento.
- Un seed distinto por entorno: el mismo sirve para local y staging.
- Asistencia marcada: no existe hasta el Sprint 4.

## Notas de implementación

_Se rellena al cerrar._
