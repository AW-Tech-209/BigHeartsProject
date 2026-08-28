# HU-308 — El schema de Prisma miente sobre el índice de reservas

| Campo               | Valor                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Sprint**          | Sprint 3 — Sistema de Reservas                                     |
| **Prioridad**       | 🔴 Crítica (bomba de relojería: la desactiva la próxima migración) |
| **Estimación**      | 0.5 días                                                           |
| **Estado**          | ⬜ Pendiente                                                       |
| **Rama**            | `hu-308-indice-de-reservas-<persona>`                              |
| **Alcance técnico** | backend                                                            |
| **Depende de**      | HU-301 (✅)                                                        |
| **Labels**          | `sprint-3` `prioridad:critica` `backend` `bug`                     |

> **Como** equipo,
> **Quiero** que el schema de Prisma describa el índice que la base de datos tiene de verdad,
> **Para** que la próxima migración no reintroduzca en silencio un bug de diseño ya corregido.

## Contexto

La base de datos **está bien**. El schema **no**.

`schema.prisma` declara `@@unique([studentId, classroomId])` —un índice único **total**—, mientras
que la migración crea a mano `bookings_active_uniq`, **parcial**, con `WHERE status = 'CONFIRMED'`.
Ninguna migración crea nunca el total. Son dos afirmaciones distintas sobre la misma tabla, y
Prisma trata su schema como la fuente de verdad.

**Qué pasa el día que alguien ejecute `prisma migrate dev`:** Prisma compara, ve que le falta el
índice total que su schema declara, y genera una migración que lo crea —y que además querrá
deshacerse del parcial, que su schema no conoce—. En cuanto eso corre, **un estudiante que canceló
no puede volver a reservar la misma clase**, porque su fila `CANCELLED` sigue ocupando el índice.

Eso es exactamente el bug que §4.3 corrigió y que `ARQUITECTURA.md` registra como **nota de
auditoría** —_«el `.docx` §8.3 imponía un índice único total»_—. Está desactivado hoy y armado para
mañana, sin que nadie lo vea venir: el comentario del schema explica la intención, pero un
comentario no cambia lo que Prisma genera.

**Segundo efecto, más silencioso.** Con `@@unique`, el Prisma Client genera
`findUnique({ where: { studentId_classroomId: … } })`. Esa consulta **también devuelve la fila
`CANCELLED`**, así que cualquier código futuro que la use para «¿ya tiene reserva?» responderá que
sí a quien canceló. La lógica de HU-301 hoy no la usa; nada impide que mañana sí.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.3 (por qué el índice es parcial), §4.2 (la garantía primaria es
  la transacción; el índice es la red de seguridad).
- **Archivos:** `apps/api/prisma/schema.prisma` (modelo `Booking`) y
  `apps/api/prisma/migrations/20260826120000_add_bookings/migration.sql`.
- **Decisión abierta que esta HU cierra:** cómo se convive con un índice que Prisma no sabe
  modelar. **Las tres salidas, para elegir una y anotarla:**
  1. **Quitar `@@unique` del schema** y dejar el índice solo en SQL, con una comprobación en CI de
     que sigue existiendo. Prisma deja de mentir; a cambio, deja de conocerlo.
  2. Dejarlo y aceptar que Prisma lo recree total. **Descartada:** rompe §4.3.
  3. `prisma migrate diff` en CI como detector de deriva. Complementa a la 1, no la sustituye.

  La 1 es la única que quita la mentira. La 3 encima es barata.

## 🔧 Tasks

### Backend

- [ ] **T1** — Quitar `@@unique([studentId, classroomId])` del modelo `Booking`, dejando el
      `@@index([studentId])` y `@@index([classroomId])` que ya existen.
- [ ] **T2** — Comprobar con `prisma migrate diff` que schema y base de datos **ya no divergen**, y
      generar la migración que haga falta si divergen. **La migración no puede borrar
      `bookings_active_uniq`.**
- [ ] **T3** — Un test que verifique que el índice parcial **existe y es parcial**. Consúltalo por
      Prisma Client o por `DIRECT_URL`: con el pooler de Supabase, `information_schema` no es de
      fiar (trampa conocida #5).
- [ ] **T4** — Un test que reserve, cancele y **vuelva a reservar** la misma aula. Es el AC3 de
      HU-301 comprobado contra la base de datos real, no contra un mock.
- [ ] **T5** — Añadir la comprobación de deriva al CI, para que la próxima vez lo diga la máquina.

### Documentación

- [ ] **T6** — Anotar la salida elegida en `ARQUITECTURA.md` §4.3, junto a la nota de auditoría del
      índice, y añadirla a las trampas conocidas del `README.md`. Es la sexta: **«Prisma no modela
      índices parciales; no vuelvas a declararlos con `@@unique`.»**

## ✅ Criterios de aceptación

- [ ] **AC1** — `prisma migrate diff` entre el schema y la base de datos migrada **no reporta
      diferencias** sobre la tabla `bookings`.
- [ ] **AC2** — Tras aplicar todas las migraciones desde cero, existe `bookings_active_uniq` **con
      su cláusula `WHERE status = 'CONFIRMED'`**, y **no** existe ningún índice único total sobre
      `(student_id, classroom_id)`.
- [ ] **AC3** — Un estudiante que reserva, cancela y vuelve a reservar la misma aula **lo consigue**,
      verificado contra la base de datos.
- [ ] **AC4** — Dos reservas `CONFIRMED` simultáneas del mismo estudiante en la misma aula siguen
      siendo imposibles: la red de seguridad no se ha perdido al quitar `@@unique`.
- [ ] **AC5** — El CI falla si alguien vuelve a introducir la deriva.
- [ ] **AC6** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- Cambiar la transacción de §4.2. Funciona y es la garantía primaria.
- Migrar a otra forma de exclusión (constraint de exclusión de PostgreSQL, por ejemplo).
- Revisar los demás índices del schema. Solo `bookings` diverge.

## Notas de implementación

_Se rellena al cerrar._
