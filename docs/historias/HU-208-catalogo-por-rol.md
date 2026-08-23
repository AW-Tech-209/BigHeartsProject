# HU-208 — El catálogo de aulas distingue quién lo mira

| Campo               | Valor                                         |
| ------------------- | --------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                   |
| **Prioridad**       | 🟠 Alta                                       |
| **Estimación**      | 1 día                                         |
| **Estado**          | ✅ Terminada                                  |
| **Rama**            | `hu-208-catalogo-por-rol-<persona>`           |
| **Alcance técnico** | frontend + backend (ver notas)                |
| **Depende de**      | HU-203 (✅)                                   |
| **Labels**          | `sprint-2` `prioridad:alta` `frontend` `a11y` |

> **Como** profesor,
> **Quiero** que en el catálogo de aulas se distingan las clases que yo imparto de las de los
> demás,
> **Para** coordinar mis horarios con el resto de la academia sin confundir lo mío con lo ajeno.

## Contexto

`GET /classrooms` no lleva `@Roles` a propósito: el catálogo es único y lo ve cualquier usuario con
sesión. Eso está bien y no se cambia.

Lo que falla es la **presentación**: hoy un profesor ve su propia clase en el catálogo exactamente
igual que la vería un estudiante — sin marca de que es suya y sin camino para gestionarla. Y en
cuanto HU-301 añada el botón de reservar, ese botón aparecerá también sobre la clase del propio
profesor si nadie lo impide antes.

**Un solo catálogo, una sola consulta, presentación distinta según quién mira.** No se duplica el
endpoint ni se crea una segunda pantalla.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.8 (visibilidad y acciones por rol), §8 (la
  autorización se decide en el servidor; el frontend solo ajusta la presentación).
- **Skills:** `bighearts-ui` → `layout-y-composicion.md` y `voz-microcopy.md`.
- **No hace falta tocar el backend.** `ClassroomListItem` ya hereda `teacherId` de `Classroom`, así
  que el frontend puede comparar contra el usuario de sesión sin pedir nada nuevo.
- **Reutiliza:** `<TarjetaAula>`, `<EstadoAula>`, `<IndicadorCupo>`, `useAuth`.

### Decisiones tomadas (2026-08-20)

**1. El profesor conserva el acceso al catálogo.** La academia tiene pocos profesores y varias
clases del mismo nivel; ver la oferta completa es lo que evita programar dos clases de básico a la
misma hora. Quitarle la pantalla ahorraría mantenimiento y le quitaría coordinación.

**2. `teacherId` es un campo crudo, no un `esMia` calculado en el servidor.** Coherente con
`ARQUITECTURA.md` §7.3: la API manda los datos y el cliente deriva la presentación. El permiso real
lo sigue decidiendo el servidor en `PATCH` y `cancel`, no esta marca.

**3. Solo el estudiante reserva.** Se fija ahora, antes de que exista el botón: `POST /bookings`
nacerá con `@Roles(STUDENT)` en HU-301, y ningún rol distinto de `STUDENT` verá jamás una acción de
reservar. Queda registrado en `ARQUITECTURA.md` §4.8 para que HU-301 lo herede escrito.

## 🔧 Tasks

### Frontend

- [x] **T1** — `<TarjetaAula>` acepta una marca de propiedad. Cuando el aula es del usuario que
      mira, muestra un distintivo **`Tu clase`** — color + ícono + texto, como todo estado en este
      producto — junto al estado del aula, sin sustituirlo.
- [x] **T2** — En una tarjeta propia, el destino del enlace y el texto de la acción cambian: lleva
      a gestionarla, no a la vista de quien va a reservar. El verbo es `Gestionar mi clase`.
- [x] **T3** — La acción de reservar **solo se pinta para `STUDENT`**. Para cualquier otro rol no
      existe el elemento — no se pinta deshabilitado, que es lo que prohíbe el skill.
- [x] **T4** — Filtro `Solo mis clases` en el catálogo, visible **únicamente para el profesor**,
      con su estado en la URL como el resto de filtros.
- [x] **T5** — Que el filtro no devuelva nada tiene su propio vacío:
      `No tienes clases publicadas con esos filtros.` No se reutiliza el vacío genérico del
      catálogo, que invita a explorar y aquí sería confuso.
- [x] **T6** — Tests: la marca aparece en la tarjeta propia y no en la ajena; la acción de reservar
      no existe para `TEACHER` ni para `ADMIN`; el filtro solo se pinta para el profesor; `axe`
      limpio en los tres roles.

### Documentación

- [x] **T7** — Recorrer la tabla de §6 del skill `bighearts-dod` y actualizar lo que quede
      desalineado.

## ✅ Criterios de aceptación

- [x] **AC1** — Un profesor abre `/aulas` y **sus propias clases llevan el distintivo `Tu clase`**
      con color, ícono y texto. Las de otros profesores no lo llevan.
- [x] **AC2** — El distintivo **no sustituye al estado del aula**: una clase propia con últimos
      cupos muestra las dos cosas.
- [x] **AC3** — En una tarjeta propia la acción dice `Gestionar mi clase` y lleva a la gestión del
      aula. En una ajena, no aparece esa acción.
- [x] **AC4** — **Ningún rol distinto de `STUDENT` ve una acción de reservar** en ninguna tarjeta.
      El elemento no está en el DOM; no está deshabilitado. Verificado con un test por rol.
- [x] **AC5** — El filtro `Solo mis clases` se pinta para `TEACHER` y **no** para `STUDENT` ni
      `ADMIN`.
- [x] **AC6** — Ese filtro deja su estado en la URL: copiar el enlace y abrirlo reproduce la vista.
- [x] **AC7** — Con el filtro activo y sin resultados, el vacío es el propio del profesor, no el
      genérico del catálogo.
- [x] **AC8** — **Accesibilidad:** el distintivo se distingue sin depender del color, la pantalla
      se recorre con teclado con foco visible, revisado **a ojo en el navegador** en `.dark` y `.hc` (jsdom no calcula CSS de verdad: eso no se testea), y `axe` sale limpio.
- [x] **AC9** — **Verificación automática:** `typecheck`, `lint`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Crear la acción de reservar.** Nace en HU-301; aquí solo se fija quién puede verla.
- **Cambiar qué devuelve `GET /classrooms`.** No hace falta.
- **Vista de supervisión del administrador** → HU-210. El admin ve el catálogo como cualquiera,
  sin marca ni acciones.
- Filtrar el catálogo por profesor concreto.
- Ocultar al profesor sus propias clases del catálogo: se marcan, no se esconden.

## Notas de implementación

**El filtro `Solo mis clases` sí tocó el backend, al revés de lo que decía esta HU.** «No hace
falta tocar el backend» era cierto para el distintivo y las acciones —`teacherId` ya viaja en
`ClassroomListItem`— pero no para el filtro: `GET /classrooms` **pagina en el servidor**, así que
filtrar en el navegador la página ya recibida habría dejado `total` —y con él «Página 1 de 3»—
contando aulas ajenas, y habría escondido las clases propias que cayeran en otra página, con el
vacío del AC7 apareciendo encima en falso. Se añadió `?mias=true`: un booleano **sin id**, con el
`teacherId` sacado de `@CurrentUser()`. Queda registrado como **D27** en `ARQUITECTURA.md`, con la
precisión a §4.8 regla 3 que explica por qué no la rompe: la regla prohíbe nombrar a un tercero o
ampliar el alcance, y este parámetro lo estrecha sobre un catálogo que el usuario ya veía entero.

**`Gestionar mi clase` lleva a `/aulas/:id`.** No existe `/mis-aulas/:id`: HU-202 (editar y
cancelar) está pendiente, y pintar un enlace a una ruta inexistente es justo la trampa que
`app/router.tsx` documenta. Para el dueño ese detalle **ya es** su vista de gestión —le revela el
enlace de la videollamada (HU-204) y es donde `<AccionesDeAula>` colgará editar y cancelar—, así
que cuando llegue HU-202 aquí solo cambia el `to`.

**La acción de reservar no se creó** (estaba fuera de alcance; nace en HU-301). Lo que sí se fijó
es quién podrá verla: `puedeReservar()` en `features/aulas/lib/` decide por rol y tiene su test por
rol, y `<AccionReservarAula>` es el hueco que HU-301 rellena —hoy devuelve `null` para todos,
incluido el estudiante, porque `POST /bookings` todavía no existe—. Mismo patrón que
`<AccionesDeAula>` con HU-202. **Consecuencia honesta: los tests de AC4 pasan hoy también para el
estudiante.** Son la red que se pone en rojo el día que HU-301 rellene ese hueco sin respetar la
regla, no una verificación de algo que ya ocurre.

**El vacío del profesor mira el rol, no solo el query.** La URL la puede teclear cualquiera: un
estudiante en `/aulas?mias=true` recibe una lista vacía —correcto, ninguna aula es suya— pero
decirle «no tienes clases publicadas, publica una clase» sería copy de otro rol. Para él queda el
vacío genérico.

**AC8, la parte que no automatiza nadie:** `axe` sale limpio en los tres temas sobre la tarjeta
propia, sobre los filtros con la casilla y sobre la pantalla completa del profesor, pero jsdom no
calcula CSS y el contraste real no se testea ahí. Falta la pasada a ojo en el navegador en `.dark`
y `.hc`. El par a mirar es `--primary-soft` / `--primary-soft-foreground`, que `.hc` no redefine y
hereda de light/dark — el mismo que ya usan los badges existentes, así que no es una regresión,
pero es lo que pinta el distintivo nuevo.
