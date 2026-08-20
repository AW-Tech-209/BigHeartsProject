# HU-203 — Listado de aulas disponibles con filtros

| Campo            | Valor                                                     |
| ---------------- | --------------------------------------------------------- |
| **Sprint**       | Sprint 2 — Gestión de Aulas                               |
| **Prioridad**    | 🔴 Crítica                                                |
| **Estimación**   | 3.5 días (3 originales + la función de estado compartida) |
| **Estado**       | ✅ Terminada (2026-08-20)                                 |
| **Rama**         | `hu-203-listado-de-aulas-<persona>`                       |
| **Colaboración** | Vertical slice compartido                                 |
| **Depende de**   | HU-201, HU-205                                            |
| **Labels**       | `sprint-2` `prioridad:critica` `fullstack` `a11y`         |

> **Como** estudiante,
> **Quiero** ver el listado de aulas disponibles y filtrarlas por nivel y horario,
> **Para** encontrar fácilmente una clase que se ajuste a mi nivel y disponibilidad.

## Contexto

Es la primera pantalla que un estudiante sordo usa de verdad, y donde se juega la prueba definitiva
del producto: **encontrar su clase sin pedirle ayuda a nadie**. La lista tiene que ser escaneable
de un vistazo, con el estado de cada aula legible sin leer una palabra.

También es donde nace el **riel de estado** — la franja de 4 px en el borde izquierdo de cada
tarjeta, que el skill de UI describe como la firma visual del producto.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §7.3 (**derivación de los 9 estados de UI**), §4.2
  (`currentBookings` como fuente del cupo), §4.1 (el enlace nunca sale aquí), §4.7 (zonas horarias).
- **Skills:** `bighearts-backend` · `bighearts-ui` → **lee `patrones-dominio.md`**
  (`<EstadoAula>`, el riel, `<IndicadorCupo>`) **y `voz-microcopy.md`** (vacíos, cargas, fechas).

### Decisiones de auditoría (2026-08-18)

**1. El cupo sale del contador `currentBookings`, no de un `COUNT` sobre reservas.** La versión
original decía "`maxStudents` − reservas confirmadas". `ARQUITECTURA.md` D9 fija el contador como
única fuente, y Sprint 3 lo mantendrá dentro de la transacción. Calcularlo de dos formas distintas
en dos sprints es garantizar que un día no coincidan.

**2. La API devuelve campos crudos; el estado se deriva con una función compartida.** Los nueve
estados de `<EstadoAula>` no son una columna: salen de `status` + cupos + hora + la reserva propia.
Esta HU crea `derivarEstadoAula()` en `@academia/types`, y **la usan las dos apps**. Es lo que
impide que el backend y el frontend digan cosas distintas sobre la misma aula.
En Sprint 2 el parámetro de reserva propia siempre llega vacío; la función ya lo contempla para
HU-301.

**3. Se excluyen también las aulas cuya hora ya pasó**, no solo `CANCELLED` y `COMPLETED` —
recuerda que `COMPLETED` no tiene escritor todavía, así que filtrar solo por estado dejaría clases
viejas en la lista.

**4. Paginación por página** (`page`, `pageSize`, por defecto 20), con respuesta
`{ items, total, page, pageSize }`. _Propuesta mía: no estaba decidida en ningún sitio._

## 🤝 Task de contrato — va primero

- [x] **T0** — En `packages/types`: el tipo `EstadoAula` (los 9 valores), la función pura
      `derivarEstadoAula()` con el orden de evaluación de `ARQUITECTURA.md` §7.3, los parámetros de
      filtro y el tipo de respuesta paginada. **Con tests unitarios de la función**: es lógica de
      negocio compartida, no un helper — un caso por cada uno de los 9 estados, más los bordes de
      la ventana de acceso. Luego `npm run build:types`.

> **HU-205 tiene que estar cerrada antes que esta T0.** `packages/types` no tenía runner de tests:
> lo añade HU-205. Y los componentes de B1–B3 nacen con sus tests dentro de esta HU, usando el
> patrón que HU-205 deja montado.

## 🔧 Tasks — Dev A (backend)

- [x] **A1** — `GET /classrooms` con filtros opcionales `level` y rango `desde`/`hasta` sobre
      `scheduledAt`, combinables entre sí.
- [x] **A2** — Excluir del listado: `status ≠ PUBLISHED` y toda aula con `scheduledAt` en el
      pasado. Ordenar por `scheduledAt` ascendente.
- [x] **A3** — Devolver por aula: `id`, `title`, `level`, `scheduledAt`, `durationMinutes`,
      `maxStudents`, `currentBookings`, `status`, y el nombre del profesor. **Nunca `meetingLink`.**
- [x] **A4** — Paginación con `page` / `pageSize`, con tope máximo de `pageSize` para que nadie
      pida diez mil filas.
- [x] **A5** — Tests: cada filtro por separado y combinados, exclusión de canceladas y pasadas,
      orden, paginación, y **un test explícito de que `meetingLink` no aparece en la respuesta**.

## 🔧 Tasks — Dev B (frontend)

- [x] **B1** — `<TarjetaAula>` en `src/components/dominio/`, con el **riel de estado** de 4 px en
      el borde izquierdo (`patrones-dominio.md`). La carpeta `components/dominio/` aún no existe:
      créala aquí.
- [x] **B2** — `<EstadoAula>` con los 9 estados y `<IndicadorCupo>` con **conteo literal**
      (`Quedan 3 cupos`), nunca porcentajes ni gráficas circulares.
- [x] **B3** — El estado se calcula llamando a `derivarEstadoAula()` de `@academia/types`. **No
      reimplementes la lógica en el componente.**
- [x] **B4** — Filtros de nivel y rango de fechas, accesibles por teclado, con el estado reflejado
      en la URL para que la vista sea compartible y sobreviva a un refresco.
- [x] **B5** — Los 4 estados: cargando con texto (`Cargando aulas disponibles…`, nunca un spinner
      mudo), **vacío que invita a actuar**, error, y la lista.
- [x] **B6** — Fechas completas con zona explícita en cada tarjeta.

## ✅ Criterios de aceptación

- [x] **AC1** — El listado devuelve **solo** aulas `PUBLISHED` con `scheduledAt` futuro. Una aula
      cancelada y una cuya hora ya pasó no aparecen.
- [x] **AC2** — **El `meetingLink` no aparece en ninguna respuesta del listado**, para ningún rol,
      ni siquiera para el profesor dueño. Verificado con un test.
- [x] **AC3** — Los filtros de nivel y de rango de fechas devuelven resultados correctos por
      separado y **combinados**, y el resultado está ordenado por `scheduledAt` ascendente.
- [x] **AC4** — Los filtros aplicados quedan en la URL: copiar el enlace y abrirlo en otra pestaña
      reproduce la misma vista.
- [x] **AC5** — **El estado de cada aula viene de `derivarEstadoAula()` de `@academia/types`.** No
      hay una segunda implementación de esa lógica en `apps/web`. Verificable leyendo el diff.
- [x] **AC6** — Cada tarjeta comunica su estado con **color + ícono + texto** y lleva el riel de
      4 px. En blanco y negro el estado sigue siendo legible.
- [x] **AC7** — El cupo se muestra como conteo literal. Un aula sin cupos se ve claramente como
      `Sin cupos`, no solo atenuada.
- [x] **AC8** — **Estado vacío:** sin resultados, el mensaje invita a actuar
      (`No hay aulas con esos filtros. Prueba con otro nivel u otra fecha.`), nunca
      `Sin resultados.`.
- [x] **AC9** — **Accesibilidad:** la lista y los filtros se recorren enteros con teclado con foco
      visible; los cambios de resultado se anuncian por `aria-live`; funciona en `.dark` y `.hc`;
      cumple el checklist del skill `bighearts-ui`.
- [x] **AC10** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde.

## 🚫 Fuera de alcance

- Botón de reservar en la tarjeta → HU-301.
- Estado de reserva propia (`reservada`, `acceso-abierto`). La función ya acepta el parámetro, pero
  en este sprint siempre llega vacío → HU-301.
- Búsqueda por texto libre y filtro por profesor.
- "Mis aulas" para el profesor (vista propia con las canceladas y pasadas incluidas): HU aparte.
- Scroll infinito. Paginación por página, y punto.

## Notas de implementación

### Decisiones que la HU no traía tomadas

1. **`derivarEstadoAula()` vive en su propio archivo (`estado-aula.ts`), no en `index.ts`.** La nota
   de cierre de HU-205 ya lo pedía así ("sus tests van en su propio `.spec.ts` junto a la función"),
   pero no estaba dicho para el archivo de la función en sí. `index.ts` la re-exporta.
2. **`ClassroomListItem` añade `teacherFirstName`/`teacherLastName` planos**, no un objeto `teacher`
   anidado. Mismo patrón de aplanado que el resto de `Classroom`, y evita mandar el email o el id
   del profesor, que esta pantalla no necesita — el frontend concatena `{firstName} {lastName}`
   igual que ya hace `pending-teachers-table.tsx`.
3. **`<IndicadorCupo>` se construyó y se testeó, pero no se cablea dentro de `<TarjetaAula>`.** B2 lo
   pide como componente; la anatomía de tarjeta de `layout-y-composicion.md` solo dibuja una línea
   de `<EstadoAula>`. Duplicar el mensaje del cupo en la misma tarjeta (badge + barra) no lo pedía
   ningún documento y iba contra "cada bloque respira". Queda listo para el detalle de aula (HU-204)
   y el flujo de reserva, donde sí hace falta el desglose completo.
4. **El texto de `<EstadoAula>` sigue la tabla literal de `patrones-dominio.md`**, no el ejemplo
   suelto de B2 (`Quedan 3 cupos`) ni el formato con emoji de `<IndicadorCupo>` en el mismo skill
   (`👥 14 de 20…`). El skill es la fuente única; los dos textos citados en la HU eran ilustrativos.
5. **`ACCESS_WINDOW_MINUTES_DEFAULT = 30`** vive como constante en `@academia/types`, con la función
   aceptando el minuto como parámetro overridable. El env var real que lo hará configurable lo trae
   HU-303; hasta entonces el default es el valor ya fijado en `contrato-api.md`.
6. **Paginación con `AND` de cláusulas repetidas de `scheduledAt`** (una para "no ha pasado", otra
   para `desde`/`hasta`) en vez de un solo objeto con `gt`+`gte` a la vez: dos claves iguales en el
   mismo objeto de Prisma se pisarían.

### Cómo quedó cada capa

- **Backend:** `GET /classrooms` sin `@Roles` (lo ve cualquier usuario autenticado, igual que ya
  documentaba `contrato-api.md` para esta ruta). Filtro, paginación y exclusión de pasadas/canceladas
  se arman en `ClassroomsService.listClassrooms()`; el mapeo pasa siempre por `toPublicClassroom`
  (vía `toClassroomListItem`), así que `meetingLink` es estructuralmente imposible de filtrar por
  descuido.
- **Frontend:** `<TarjetaAula>` deriva su estado llamando a `derivarEstadoAula({ classroom, ahora:
new Date() })` en cada render — no hay temporizador propio; los estados que dependen del reloj
  (`en-curso`, `finalizada`, `acceso-abierto`) se recalculan solos en el siguiente refetch o
  re-render, que es suficiente para esta HU (el conteo regresivo en vivo es de `<VentanaDeAcceso>`,
  fuera de alcance). Los filtros y la página vivien en la URL vía `useSearchParams` +
  `filtros-url.ts` (puro, con su propio test de round-trip).

### Verificado a mano, además de con tests

`docker compose up` completo (Postgres + API + web aislados, sin tocar el `.env` de Supabase de
staging) con 22 aulas creadas de verdad vía `POST /classrooms` como el profesor sembrado. Con
Playwright headless, como el estudiante sembrado (`alumno@academia.local`):
navegación a `/aulas`, filtro por nivel (URL → `?level=ADVANCED`, 7 de 22 resultados), paginación
(20 + 2, "Página 1 de 2" → "Página 2 de 2" al pulsar Siguiente, URL → `?page=2`), estado vacío con
filtro sin resultados (texto exacto de AC8 + botón "Quitar filtros"), navegación directa a una URL
con filtro (el `<select>` de Nivel refleja el valor de la URL al montar — AC4), y captura visual en
`.dark` y `.hc`: rail, badges e íconos siguen siendo legibles en los tres temas. Sin errores de
consola aparte de un 401 esperado del bootstrap de sesión antes de iniciar sesión.

### Pendiente para otras HUs

- `<IndicadorCupo>` queda sin ningún consumidor real todavía (nace con esta HU, lo usará HU-204 o el
  flujo de reserva).
- `myBookingStatus` no viaja por la red: el módulo de `bookings` no existe. `derivarEstadoAula()` ya
  acepta `tieneReservaConfirmada`/`estadoDelProfesorQueMira`, pero el frontend los llama siempre en
  `undefined`. Los estados `reservada`/`acceso-abierto`/`pendiente-aprobacion` quedan cubiertos por
  test unitario, no por ningún camino real de la UI todavía.
- Se corrigió de paso un comentario desactualizado en `MisAulasPage.tsx` (HU-201) que anunciaba que
  "HU-203 trae la rejilla" a esa pantalla — el propio HU-203 la deja fuera de alcance explícitamente
  ("Mis aulas: HU aparte"). El comentario ahora apunta a esa HU futura en vez de a esta.
