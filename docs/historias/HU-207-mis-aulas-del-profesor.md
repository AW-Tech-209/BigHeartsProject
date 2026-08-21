# HU-207 — Mis aulas: listado del profesor

| Campo            | Valor                                             |
| ---------------- | ------------------------------------------------- |
| **Sprint**       | Sprint 2 — Gestión de Aulas                       |
| **Prioridad**    | 🔴 Crítica                                        |
| **Estimación**   | 2 días                                            |
| **Estado**       | ✅ Completada (2026-08-21), salvo AC9             |
| **Rama**         | `hu-207-mis-aulas-del-profesor-<persona>`         |
| **Colaboración** | Paralelo con contrato acordado                    |
| **Depende de**   | HU-201 (✅), HU-206 (✅), HU-203 (✅)             |
| **Labels**       | `sprint-2` `prioridad:critica` `fullstack` `a11y` |

> **Como** profesor,
> **Quiero** ver todas las aulas que he creado, incluidas las pasadas y las canceladas,
> **Para** saber qué he publicado, entrar a gestionarlas y llevar registro de lo que he impartido.

## Contexto

**Hueco detectado el 2026-08-19, con HU-201 ya cerrada.** El profesor puede crear aulas y no tiene
dónde verlas.

`MisAulasPage` existe desde HU-206 y la navegación del profesor ya la enlaza, pero **es un estado
vacío permanente**: nunca lista nada. Un profesor que crea tres aulas sigue leyendo "Todavía no
creaste ninguna aula". La única forma de llegar a un aula propia hoy es escribir su URL a mano.

Y como el detalle (HU-204) es el punto de entrada a editar y cancelar (HU-202), **sin esta pantalla
toda la gestión del profesor queda inalcanzable**, por muy implementada que esté.

> **Corrección de un comentario equivocado.** `MisAulasPage.tsx` dice hoy que "el LISTADO llega en
> HU-203". No es cierto: HU-203 es el listado **público** del estudiante —solo `PUBLISHED` y
> futuras— y su propia sección de _Fuera de alcance_ remite «Mis aulas» a una HU aparte. Esta.
> **Ese comentario se corrige en T5.**

### Por qué no es HU-203 con otro filtro

|                         | HU-203 (estudiante)                 | Esta HU (profesor)                                 |
| ----------------------- | ----------------------------------- | -------------------------------------------------- |
| Qué muestra             | Solo `PUBLISHED` con horario futuro | **También canceladas y pasadas** — es su historial |
| Para qué filtra         | Nivel y fecha, para **descubrir**   | Estado temporal, para **gestionar**                |
| Alcance del endpoint    | Público, cualquier autenticado      | Acotado **al token**, nunca por parámetro          |
| Qué necesita la tarjeta | Cupo, para decidir si reservar      | Inscritos y acceso a las acciones                  |

Reutiliza los componentes de HU-203; no duplica su endpoint.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §7.3 (derivación de estados), §4.1 (el enlace no
  viaja en listados), §8 (el alcance se decide en el servidor), §4.7 (zonas horarias).
- **Skills:** `bighearts-backend` → `contrato-api.md` · `bighearts-ui` →
  **`layout-y-composicion.md`** (la regla de una sola acción primaria por pantalla) y
  `patrones-dominio.md`.
- **Reutiliza de HU-203:** `derivarEstadoAula()`, `<TarjetaAula>`, `<EstadoAula>`,
  `<IndicadorCupo>`. **No los dupliques ni los variantes sin necesidad.**
- **Reutiliza de HU-206:** `<AppShell>`, `<PaginaCabecera>`, `<Contenedor>`, `<RejillaAulas>`,
  `<EstadoVacio>` — ya están en la pantalla.
- **Habilita:** HU-204 y HU-202. Sin este listado, el detalle del aula propia y sus acciones de
  edición no tienen punto de entrada.
- **⚠️ Salda una deuda de HU-209.** El panel del profesor ya está construido y **hoy lee una fuente
  provisional**, a la espera de este endpoint. Ver T6.

### Decisiones de auditoría (2026-08-19)

**1. El alcance sale del token, nunca de un parámetro.** No existe `GET /classrooms?teacherId=X`.
Un profesor no puede pedir las aulas de otro cambiando la URL — es la misma regla que en HU-103 con
el perfil.

**2. Se muestran todas: publicadas, canceladas y pasadas.** Es el registro del profesor. Ocultar
las pasadas dejaría sin sitio el historial que promete
[`DEFINICION_PROYECTO.md` §5.1](../DEFINICION_PROYECTO.md#51-dentro-del-alcance).

**3. El `meetingLink` tampoco viaja aquí**, aunque el que pide sea el dueño. Es un listado; el
enlace se revela en el detalle (HU-204). Misma regla que en HU-203, sin excepción por rol.

**4. El botón `Crear una clase` se mueve a la cabecera.** Hoy vive dentro del estado vacío porque
era lo único que había. Con lista, la acción primaria va en `<PaginaCabecera>`, y **solo en un
sitio**: repetirla en el vacío y en la cabecera deja dos acciones primarias compitiendo, que es lo
que prohíbe `layout-y-composicion.md`. En el vacío se queda; en cuanto hay lista, sube.

## 🤝 Task de contrato — va primero

- [x] **T0** — En `packages/types`: el filtro `EstadoTemporalAula` (`proximas | pasadas |
canceladas | todas`) y el tipo de respuesta de la vista del profesor —lo del listado, más
      `currentBookings` y `maxStudents` explícitos—. Reutiliza el tipo de aula de HU-201; no
      declares uno paralelo. Luego `npm run build:types`.

## 🔧 Tasks — Dev A (backend)

- [x] **A1** — `GET /classrooms/mias` con `@Roles('TEACHER')`. El `teacherId` sale **del token**.
      No se acepta ningún parámetro que lo sustituya.
- [x] **A2** — Devuelve **todas** las aulas del profesor: `PUBLISHED`, `CANCELLED`, y las que ya
      pasaron. Sin excluir nada por defecto.
- [x] **A3** — Filtro opcional por estado temporal. Orden: **próximas ascendente** (la más cercana
      primero), **pasadas descendente** (la más reciente primero).
- [x] **A4** — El `meetingLink` **no se incluye**, ni siquiera para el dueño. Ver decisión 3.
- [x] **A5** — Paginación con el mismo formato que HU-203 (`page`, `pageSize`, respuesta
      `{ items, total, page, pageSize }`). No inventes un segundo formato.
- [x] **A6** — Tests: solo devuelve las del profesor autenticado; un `STUDENT` recibe `403`; un
      profesor no ve las de otro; cada filtro; el orden; y **un test explícito de que
      `meetingLink` no aparece**.

## 🔧 Tasks — Dev B (frontend)

- [x] **B1** — `MisAulasPage` lista de verdad, con `<RejillaAulas>` y `<TarjetaAula>`.
- [x] **B2** — Filtro por estado temporal, accesible por teclado y **con el estado en la URL**,
      igual que en HU-203.
- [x] **B3** — La tarjeta en esta pantalla muestra **inscritos sobre cupo** (`3 de 10 inscritos`)
      en vez del cupo disponible: al profesor le importa cuánta gente viene, no cuánto queda.
- [ ] **B4** — Cada tarjeta enlaza al detalle del aula (HU-204), que es donde viven editar y
      cancelar. **No metas las acciones en la tarjeta**: multiplicarlas por seis tarjetas rompe la
      regla de una acción primaria por pantalla.
      → **La segunda mitad se cumplió; el enlace no.** HU-204 no existe: no hay ruta ni pantalla de
      detalle, así que enlazar habría mandado al profesor a un 404. **Pasa a HU-204 (su B6/AC9),**
      donde queda documentado. Ver AC9.
- [x] **B5** — Mover `Crear una clase` a `<PaginaCabecera>` y **quitarlo del estado vacío** cuando
      haya lista. Decisión 4.
- [x] **B6** — Los 4 estados: cargando con texto, vacío (ya existe), error, y lista.
- [x] **B7** — Fechas completas con zona explícita, como en el resto del producto.

## 🔧 Tarea de higiene

- [x] **T5** — Corregir el comentario de `MisAulasPage.tsx` que atribuye este listado a HU-203.
      Documenta la relación real: HU-203 es el listado público, esta HU es la vista del profesor.

- [x] **T6** — **Sacar al panel del profesor de su fuente provisional.** Ver el detalle debajo.

### T6 en detalle — la deuda que dejó HU-209

`features/panel/components/panel-profesor.tsx` muestra hoy las próximas clases del profesor
**filtrando el catálogo público por `teacherId` en el cliente**, porque `GET /classrooms/mias` no
existía cuando se construyó el panel. Es una ventana aproximada: si las clases del profesor caen
fuera de las `CLASSROOMS_PAGE_SIZE_MAX` próximas de **toda** la academia, el panel muestra el vacío
teniéndolas — exactamente la clase de mentira que originó HU-209.

Con este endpoint en pie:

1. Cambiar la consulta a `GET /classrooms/mias` con el filtro `proximas`, que ya viene acotado al
   token y ordenado ascendente. **Se acabó el filtro en cliente**: borrar el `.filter()` por
   `teacherId` y la dependencia de `useAuth` que existe solo para eso.
2. Borrar del comentario del componente el bloque _«⚠️ De dónde sale el dato, y por qué es
   provisional»_ y sustituirlo por la referencia a este endpoint.
3. Quitar de `ARQUITECTURA.md` §9 la nota **«Deuda conocida de HU-209»**, que existe solo para
   señalar esto.
4. Los tests del panel del profesor en `pages/PanelPage.spec.tsx` pasan a mockear la frontera de red
   nueva. El caso «descarta las de otro profesor» **deja de aplicar al cliente**: el alcance lo
   garantiza el servidor y se prueba en A6/AC3.

## ✅ Criterios de aceptación

- [x] **AC1** — Un profesor con tres aulas creadas las ve **las tres** en `/mis-aulas`. Ya no
      aparece el estado vacío.
- [x] **AC2** — **Aparecen también las canceladas y las que ya pasaron**, cada una con su estado en
      color + ícono + texto. Una clase de la semana pasada sigue estando.
- [x] **AC3** — **Alcance:** el listado contiene únicamente aulas cuyo `teacherId` es el del token.
      Un segundo profesor con sus propias aulas no ve ninguna del primero. Verificado con test de
      backend.
- [x] **AC4** — Un `STUDENT` recibe `403` en `GET /classrooms/mias`.
- [x] **AC5** — **El `meetingLink` no aparece en la respuesta**, aunque quien pide sea el dueño.
      Verificado con un test.
- [x] **AC6** — Los filtros de estado temporal devuelven lo correcto y **quedan en la URL**: copiar
      el enlace y abrirlo reproduce la misma vista.
- [x] **AC7** — El orden es próximas ascendente y pasadas descendente.
- [x] **AC8** — Cada tarjeta muestra **inscritos sobre cupo**, no cupos disponibles.
- [ ] **AC9** — Pulsar una tarjeta lleva al detalle del aula, desde donde el dueño puede editar y
      cancelar (HU-204 y HU-202).
      → **NO CUMPLIDO, y a propósito.** Este AC depende de una pantalla que HU-204 todavía no ha
      construido: no hay ruta `/aulas/:id` ni vista de detalle. Enlazar de todos modos habría dejado
      cada tarjeta cayendo en el 404, que es exactamente lo que `app/router.tsx` documenta como
      prohibido —«un enlace visible que cae en un 404 enseña al usuario a desconfiar de la
      navegación»—. **La deuda está anotada en `HU-204-detalle-de-aula.md`**, con la tarea concreta
      (B6) y su propio AC9, y es esa HU la que marca este casilla al cerrarse.
- [x] **AC10** — **Una sola acción primaria:** con lista, `Crear una clase` está en la cabecera y
      **no** se repite en ningún otro punto de la pantalla.
- [x] **AC11** — El estado de cada aula viene de `derivarEstadoAula()` de `@academia/types`, sin una
      segunda implementación.
- [x] **AC12** — **Accesibilidad:** la rejilla y los filtros se recorren con teclado con foco
      visible, el cambio de resultados se anuncia por `aria-live`, `axe` limpio, y funciona en
      `.dark` y `.hc`.
- [x] **AC13** — **El panel del profesor (`/panel`) lee de `GET /classrooms/mias`**, no del catálogo
      público. `grep -rn "teacherId ===" apps/web/src` no devuelve nada en
      `features/panel/`, y la nota «Deuda conocida de HU-209» ya no está en `ARQUITECTURA.md` §9.
- [x] **AC14** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **La lista de estudiantes inscritos** en cada aula → HU-304. Aquí solo el conteo.
- **Editar y cancelar desde la tarjeta** → se hace desde el detalle (HU-204 → HU-202).
- **Marcar asistencia** → HU-404.
- Duplicar un aula o crear a partir de una existente.
- Métricas del profesor (ocupación media, asistencia). Fase posterior.
- Exportar el historial.

## Notas de implementación

### Decisiones que hubo que tomar y no estaban en la HU

**1. Los tres filtros son disjuntos; el estado gana sobre la fecha.** Una clase **cancelada del mes
que viene** sale en `canceladas` y **no** en `proximas`. Sin esa regla los filtros se solapan,
`todas` duplicaría filas y los totales dejarían de sumar. Registrado como **D24** en
`ARQUITECTURA.md` §4.8.

**2. `todas` se sirve como dos listas concatenadas**, no como una consulta con otro `ORDER BY`: el
orden que pide el AC7 cambia de sentido en `now` —ascendente antes, descendente después— y Prisma no
ordena por una expresión. Se resuelve con dos `findMany` y el reparto de la página entre ambos
bloques, con un test específico de la página que cae **a caballo** entre los dos.

**3. El corte temporal es `scheduledAt`, no el instante de fin.** Una clase que empezó hace diez
minutos ya cuenta como «pasada» en el filtro, aunque `derivarEstadoAula()` la pinte —correctamente—
como `en-curso` en su tarjeta. Es el mismo corte que usa el catálogo público, y comparar contra
`scheduledAt + durationMinutes` exigiría una expresión sobre dos columnas que Prisma no filtra. La
coherencia fina del eje temporal es **HU-212**.

**4. La tarjeta del profesor omite el badge cuando el estado sale del cupo.** El AC8 pide «inscritos
sobre cupo, **no** cupos disponibles», y el estado `ultimos-cupos` del diccionario dice literalmente
«Quedan 3 cupos»: los dos no caben sin contradecirse. Así que en `perspectiva="profesor"`,
`disponible`/`ultimos-cupos`/`llena` no pintan badge —lo dice mejor «8 de 10 inscritos»— y
`cancelada`/`finalizada`/`en-curso` sí lo conservan, porque no salen del cupo. **El riel de 4px
lleva el estado derivado en las dos perspectivas**, así que AC2 y AC11 se cumplen enteros.
Documentado en `patrones-dominio.md`.

**5. `MisAulasResponse.items` son `Classroom`, no `ClassroomListItem`.** El nombre del profesor que
el catálogo necesita para la tarjeta aquí sobra: el profesor es quien pregunta. `<TarjetaAula>` pasó
a aceptarlo como opcional.

**6. El servicio NO comprueba el estado `ACTIVE` del profesor contra la BD**, al revés que
`createClassroom`. Leer lo propio no tiene efectos sobre nadie, y quitarle el historial a un profesor
suspendido sería castigar con pérdida de registro.

### Un defecto ajeno que este trabajo destapó

`axe` sobre la rejilla **con datos** encontró un `heading-order`: la página salta del `<h1>` de la
cabecera al `<h3>` de la tarjeta. **Estaba también en `/aulas`** desde HU-203 y nadie lo había visto
porque `paginas.spec.tsx` solo recorre esas pantallas en su estado vacío. Arreglado en las dos con un
`<h2 className="sr-only">` antes de la rejilla, y cubierto con un test de `axe` **con datos** en cada
una.

### Lo que quedó pendiente

- **AC9 y la mitad de B4** — el enlace de la tarjeta al detalle. Depende de HU-204, que no existe.
  Documentado allí como B6 y AC9. Nada más quedó fuera.
