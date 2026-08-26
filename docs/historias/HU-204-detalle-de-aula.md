# HU-204 — Detalle de un aula

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Sprint**       | Sprint 2 — Gestión de Aulas                                           |
| **Prioridad**    | 🟠 Alta                                                               |
| **Estimación**   | 2 días                                                                |
| **Estado**       | ✅ Completada (2026-08-21); AC5 y AC8 cerrados en HU-215 (2026-08-25) |
| **Rama**         | `hu-204-detalle-de-aula-<persona>`                                    |
| **Colaboración** | Paralelo con contrato acordado                                        |
| **Depende de**   | HU-203 (✅), HU-207 (✅)                                              |
| **Labels**       | `sprint-2` `prioridad:alta` `fullstack` `a11y`                        |

> **Como** estudiante o profesor,
> **Quiero** ver el detalle completo de un aula,
> **Para** conocer toda su información antes de reservar o gestionarla.

## Contexto

Cierra el Sprint 2: es la pantalla a la que redirige la creación (HU-201), desde donde el profesor
edita o cancela (HU-202) y donde en el Sprint 3 aparecerán el botón de reservar y la ventana de
acceso al enlace.

Por eso importa que su estructura quede bien ahora: HU-301 y HU-303 van a colgar de aquí.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.1 (quién ve el enlace), §7.3 (derivación de
  estados), §4.7 (zonas horarias).
- **Skills:** `bighearts-backend` · `bighearts-ui`.
- **Reutiliza de HU-203:** `derivarEstadoAula()`, `<EstadoAula>` e `<IndicadorCupo>`. No los
  dupliques.

### Decisiones de auditoría (2026-08-18)

**1. En este sprint el enlace se devuelve únicamente al profesor dueño.** La regla completa
—estudiante con reserva `CONFIRMED` dentro de la ventana de 30 minutos— necesita `Booking`, que no
existe hasta el Sprint 3. **HU-303 la completa.** Deja el punto de decisión aislado en un método
del servicio para que HU-303 solo tenga que extenderlo, no reescribir el endpoint.

**2. El "estado de reserva del usuario actual" sale de esta HU.** No hay `Booking` en Sprint 2. El
campo existe en el contrato y llega vacío; HU-301 lo rellena.

**3. Un aula `CANCELLED` sigue siendo visible en el detalle**, aunque no aparezca en el listado.
Quien tenga el enlace de la página debe poder entender qué pasó, no toparse con un 404 — el
producto se juega la confianza del usuario, y un 404 aquí parece un error de la plataforma.
**Sin enlace de reunión, en ningún caso.**

### Decisión de implementación (2026-08-21) — el CTA de gestión

**HU-202 sigue pendiente**: no existen `PATCH /classrooms/:id`, ni la cancelación, ni la ruta de
edición. Y su propia cabecera dice que «de HU-204 toma su punto de entrada», así que las dos HU se
señalaban mutuamente. Se decidió **no pintar `Editar clase` ni `Cancelar clase` todavía**: un botón
que cae en un 404 es exactamente lo que `app/router.tsx` prohíbe y lo que dejó abierto el AC9 de
HU-207, y pintarlo deshabilitado lo prohíbe el skill de UI («deshabilitar sin explicar»).

En su lugar queda el punto de anclaje aislado en `features/aulas/components/acciones-de-aula.tsx`,
que hoy devuelve `null` y documenta la condición exacta con la que HU-202 tiene que rellenarlo.
Consecuencia en los AC: **AC5 y AC8 cumplen parcialmente** — ver el recorrido de abajo.

## 🤝 Task de contrato — va primero

- [x] **T0** — En `packages/types`: el tipo `ClassroomDetail` (todo lo del listado + `description` + los datos del profesor + `meetingLink` **opcional y omitido** cuando no aplica + el campo
      de reserva propia, vacío en este sprint). Luego `npm run build:types`.
      → `ClassroomDetail extends ClassroomListItem` (que ya trae `description` y el nombre del
      profesor), más `myBookingStatus: BookingStatus | null`. Se añadieron también
      `ClassroomDetailResponse`, el código `CLASSROOM_NOT_FOUND` y el enum `BookingStatus`, que
      todavía no tiene gemelo en Prisma (ver «Notas de implementación»).

## 🔧 Tasks — Dev A (backend)

- [x] **A1** — `GET /classrooms/:id` con el detalle completo del aula. Accesible a cualquier
      usuario autenticado.
- [x] **A2** — **Un único método** que decide si el enlace viaja. En Sprint 2 su regla es "el que
      pide es el profesor dueño". Documentado con un comentario que apunte a HU-303 como la HU que
      lo extiende. El campo **se omite**, no viaja vacío ni en `null`.
      → `ClassroomsService.revelarElEnlace()`. Añade además la regla de la decisión 3: un aula
      `CANCELLED` no revela el enlace a nadie, ni al dueño.
- [x] **A3** — Un aula `CANCELLED` se devuelve con su estado; un `id` inexistente responde
      `404 CLASSROOM_NOT_FOUND`.
- [x] **A4** — Tests: dueño recibe enlace; otro profesor, estudiante y admin **no**; aula cancelada
      visible sin enlace; id inexistente `404`.

## 🔧 Tasks — Dev B (frontend)

- [x] **B1** — Vista de detalle con un solo `<h1>` (el título del aula) y el foco movido a él al
      entrar en la ruta (`usePageTitle` ya lo hace; úsalo).
- [x] **B2** — Información completa: profesor, nivel, descripción, fecha con **zona explícita**,
      duración y cupo con `<IndicadorCupo>`.
- [x] **B3** — Estado del aula con `<EstadoAula>`, derivado con la función compartida.
- [ ] **B4** — CTA contextual por rol: profesor dueño → `Editar clase` y `Cancelar clase`
      (HU-202); estudiante y resto → solo lectura en este sprint. **No pintes un botón de reservar
      deshabilitado**: el skill prohíbe deshabilitar sin explicar, y aquí no hay nada que explicar
      todavía.
      → **La mitad de solo lectura está.** Los dos botones del dueño no: HU-202 no existe. Ver la
      decisión de implementación de arriba.
- [x] **B5** — Los 4 estados: cargando, no encontrada, error y contenido.
- [x] **B6** — **Saldar la deuda del AC9 de HU-207**: registrar la ruta y convertir el título de
      `<TarjetaAula>` en enlace al detalle, en las dos perspectivas.

## ✅ Criterios de aceptación

- [x] **AC1** — El detalle muestra título, profesor, nivel, descripción, fecha con zona explícita,
      duración, cupo y estado.
      → `AulaDetallePage.spec.tsx`, bloque «información completa»: el `<h1>` es el título, la línea
      de contexto dice «Clase de nivel intermedio con Ana Restrepo.», la descripción va bajo su
      `<h2>`, la duración se lee «1 hora 30 minutos», la fecha termina en `(zona)` y el cupo es un
      `progressbar` con `aria-valuetext`. El estado, en el bloque de `derivarEstadoAula()`.
- [x] **AC2** — **El profesor dueño recibe el `meetingLink`.** Cualquier otro usuario —otro
      profesor, un estudiante, un admin— recibe una respuesta **sin ese campo**: no está presente,
      no llega en `null`, no llega cifrado. Verificado con tests por cada rol.
      → `classrooms.service.spec.ts`, «quién ve el enlace»: el dueño lo recibe descifrado; los otros
      tres roles, un `it.each` que comprueba `not.toHaveProperty`, `Object.keys` sin la clave, y el
      JSON sin la URL **ni el texto cifrado** (el fixture cifra de verdad con `MeetingLinkCipher`).
- [x] **AC3** — Un `id` inexistente responde `404 CLASSROOM_NOT_FOUND` y la interfaz muestra un
      estado de "no encontrada" con salida hacia el listado, no una pantalla en blanco.
      → Servicio: `codigoDe(...)` sobre un `findUnique` que devuelve `null`. Controlador: el
      `ParseUUIDPipe` traduce un id malformado al mismo 404. Frontend: `<h1>` «No encontramos esta
      clase», `<EstadoVacio>` y enlace `Ver las aulas publicadas` → `/aulas`.
- [x] **AC4** — Un aula `CANCELLED` se puede abrir: muestra su estado con color + ícono + texto,
      sin acciones y sin enlace.
      → Servicio: se devuelve con `status: CANCELLED`, y un test aparte comprueba que **ni el dueño**
      recibe el enlace. Frontend: badge «Clase cancelada» (`<EstadoAula>` = color + ícono + texto),
      sin acciones, sin sección de enlace.
- [x] **AC5** — El CTA cambia según el rol: el dueño ve editar y cancelar; el resto, ninguna acción
      de gestión.
      → HU-202 ya implementa editar/cancelar. Verificado manualmente en HU-215 (2026-08-25): el
      dueño ve ambas acciones, el resto no ve ninguna.
- [x] **AC6** — El estado del aula usa `derivarEstadoAula()` de `@academia/types`, sin una segunda
      implementación en la pantalla.
      → Única llamada en `AulaDetallePage.tsx`; `grep -rn "derivarEstadoAula" apps/web/src` solo
      devuelve la tarjeta y esta página. Probado con «pocos cupos» y «llena» sobre un aula
      `PUBLISHED`, que es donde una reimplementación se notaría.
- [x] **AC7** — **Accesibilidad:** un solo `<h1>`, el foco salta a él al navegar, la página se
      recorre entera con teclado con foco visible, funciona en `.dark` y `.hc`, y cumple el
      checklist del skill `bighearts-ui`.
      → Un `<h1>` y foco, probados; `axe` limpio en `light`/`dark`/`hc` sobre tres de los cuatro
      estados. Teclado: todo son elementos nativos (`<a>`, `<button>`), y el enlace de la tarjeta se
      alcanza con `user.tab()` en `tarjeta-aula.spec.tsx`. Checklist recorrido en el cierre.
- [x] **AC8** — **Cierra el AC9 de HU-207:** pulsar una tarjeta en `/mis-aulas` y en `/aulas` lleva
      al detalle de esa aula, y desde el detalle el dueño puede editar y cancelar (HU-202). Con el
      AC marcado también en el archivo de HU-207.
      → Navegación cubierta por tests. «Desde el detalle el dueño puede editar y cancelar»
      verificado manualmente en HU-215 (2026-08-25), ahora que HU-202 existe.
- [x] **AC9** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde.
      → Los cinco, más `npm run test` completo (249 + 463 + 38). `lint` sin errores; los 7 warnings
      de `react-refresh` son previos y en archivos que esta HU no tocó.

## 🚫 Fuera de alcance

- **Botón de reservar** → HU-301.
- **Ventana de acceso de 30 minutos y enlace para estudiantes** → HU-303. Aquí solo queda aislado
  el punto donde esa regla va a vivir.
- **Estado de reserva propia** (`Tienes tu cupo`, `Ya puedes entrar`) → HU-301 y HU-303.
- **Lista de estudiantes inscritos** para el profesor → HU-304.
- Compartir el aula por enlace público sin autenticación.

## Notas de implementación

**El punto de decisión del enlace.** `ClassroomsService.revelarElEnlace()` es el único sitio del
servidor que decide si `meetingLink` viaja, y lo hace en dos pasos: primero corta por
`status = CANCELLED` —esa reunión no va a ocurrir, así que no la ve nadie—, después por identidad.
HU-303 solo tiene que añadir la rama del estudiante ahí dentro. El servicio **descifra únicamente si
el enlace va a viajar**: sin esa condición, el texto en claro existiría en memoria en cada petición
de cualquier usuario. Y el mapeador **añade la clave condicionalmente en vez de asignarle
`undefined`**, para que el campo no exista en el objeto y no solo desaparezca al serializar a JSON.

**`BookingStatus` se adelantó a su modelo.** Está en `@academia/types` con los cuatro miembros que
fija `ARQUITECTURA.md` §7.2, y **sin gemelo en `schema.prisma`**, que es la única vez que el contrato
rompe esa convención. La alternativa era dejar `myBookingStatus` sin tipo o inventarle uno propio, y
las dos obligarían a HU-301 a cambiar la forma del contrato en vez de solo empezar a rellenarlo. Un
test en `index.spec.ts` fija la lista para que la migración de HU-301 se escriba contra ella.

**El `<h1>` cambia con el estado.** Cargando, no encontrada, error y el aula tienen cada uno su
título, así que la cabecera nunca queda vacía y `usePageTitle` mueve el foco en cada transición: quien
navega con lector oye «Cargando la clase…» y después el nombre real. Por eso el estado de carga **no**
lleva la región `role="status"` con texto `sr-only` que sí llevan `/aulas` y `/mis-aulas` —allí el
`<h1>` es fijo y sin ella la espera sería muda; aquí sonaría dos veces seguidas—.

**Un 404 no se reintenta.** `useClassroom` sobrescribe el reintento por defecto de React Query:
insistir en un aula que no existe solo retrasa el estado de «no encontrada» tres rondas de backoff.
Los fallos de red sí se reintentan, **pero una sola vez**: a partir de ahí es mejor enseñar el error
con su botón `Volver a cargar` —donde el usuario ve que algo pasó y decide— que dejarlo mirando un
esqueleto mudo durante siete segundos.

**Un fallo latente de la suite de tests, arreglado de paso.** Los dos recorridos con teclado de
`formulario-aula.spec.tsx` ya corrían a 4,1 s y 5,0 s contra el `testTimeout` por defecto de 5 s:
`user-event` teclea carácter a carácter con temporizadores reales, y once campos cuestan eso. Añadir
esta HU bastó para que los workers compitieran por CPU y los dos se pasaran del límite —un fallo que
parecía de esta HU y no lo era, y que le habría tocado a la siguiente—. Se subió `testTimeout` a
15 s en `apps/web/vitest.config.ts`, con el porqué al lado, y se anotó en el skill `bighearts-dod`
§5. La suite pasa tres veces seguidas.

**El enlace de la tarjeta es el título, no la tarjeta.** El `<article>` ya toma su nombre accesible
del `<h3>` por `aria-labelledby`; envolver la tarjeta entera metería la fecha, el estado y el cupo
dentro del texto del enlace. El anillo de foco lo pinta la tarjeta con `focus-within:ring-2`, que es
lo que deja ver **cuál** de las seis tarjetas de la rejilla tiene el foco.

**El orden de rutas tiene un test.** `@Get(':id')` va el último del controlador, y
`classrooms.controller.spec.ts` comprueba con `Object.getOwnPropertyNames` que `listMias` se declara
antes: si alguien invierte el orden, `/classrooms/mias` empezaría a responder 404 y nada más lo
avisaría.

**Se muestra el enlace a quien lo recibe.** No estaba en B2, pero un campo que el servidor manda y la
pantalla no pinta es una función a medias: el profesor lo copia desde ahí. Es una sección simple —no
`<VentanaDeAcceso>`, que es HU-303 con sus cinco fases— y su texto de ayuda está escrito para el
dueño; HU-303 tendrá que revisarlo cuando el estudiante también lo reciba.

### Lo que quedó pendiente

- **La mitad positiva del AC5 y del AC8** — `Editar clase` y `Cancelar clase`. Dependen de HU-202,
  que no existe: sin `PATCH /classrooms/:id` ni ruta de edición, pintarlos habría dejado al profesor
  cayendo en un 404. El hueco está aislado en `<AccionesDeAula>`, con la condición documentada.
- **`axe` sobre el estado de error de lectura** — cubierto en carga, no encontrada y contenido. Ese
  cuarto estado tarda un reintento con backoff en aparecer, y multiplicarlo por tres temas añadía
  segundos al suite para un `<Callout>` que ya se verifica en `/aulas` y `/mis-aulas`. Su contenido
  sí está probado, solo no pasa por `axe`.
- **El texto de ayuda del enlace está escrito para el profesor dueño** («Solo tú lo ves»). Hoy es
  cierto —es el único que lo recibe—, pero HU-303 tendrá que ramificarlo cuando el estudiante con
  cupo también lo vea. Anotado en el comentario junto al componente.
- **`myBookingStatus` siempre `null`** y **`estadoDelProfesorQueMira` sin usar** — los dos por la
  misma razón: no hay `Booking`, y un profesor `PENDING` no puede tener aulas que mirar. Fuera de
  alcance por decisión de la propia HU.
