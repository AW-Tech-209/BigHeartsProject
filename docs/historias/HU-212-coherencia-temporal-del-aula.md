# HU-212 — Coherencia temporal del aula

| Campo               | Valor                                           |
| ------------------- | ----------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                     |
| **Prioridad**       | 🟠 Alta                                         |
| **Estimación**      | 1 día                                           |
| **Estado**          | ✅ Completa — AC8 cerrado por HU-202            |
| **Rama**            | `hu-212-coherencia-temporal-del-aula-<persona>` |
| **Alcance técnico** | fullstack                                       |
| **Depende de**      | HU-201 (✅)                                     |
| **Labels**          | `sprint-2` `prioridad:alta` `fullstack`         |

> **Como** profesor,
> **Quiero** que la plataforma no me deje publicar una clase imposible,
> **Para** no descubrir el choque de horarios cuando ya tengo estudiantes esperando.

## Contexto

HU-201 valida que el horario sea futuro, que el cupo sea mayor que cero y que el enlace tenga
formato de URL. **No valida nada más**, y eso deja pasar tres cosas que no deberían existir:

1. **Un profesor puede crear dos clases suyas a la misma hora.** Nadie está en dos videollamadas a
   la vez. La regla de no-solapamiento existe en `ARQUITECTURA.md` §4.4 **solo para el estudiante**;
   quien físicamente no puede duplicarse es el profesor, y ahí no hay regla.
2. **`durationMinutes` no tiene techo.** Se puede publicar una clase de diez mil minutos.
3. **`scheduledAt` puede ser dentro de dos minutos.** Una clase creada con esa antelación rompe a la
   vez la ventana de acceso de 30 min (§4.1) y el recordatorio de 24 h (§4.6): las dos promesas
   centrales del producto quedan sin poder cumplirse.

HU-208 justifica darle el catálogo al profesor precisamente **para coordinar horarios**. Coordinar a
ojo, mirando tarjetas, no es coordinar: es esperar que no se equivoque.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.4 (no solapamiento, hoy solo del estudiante),
  §4.1 (ventana de acceso), §4.6 (recordatorios), §4.7 (`timestamptz` en UTC).
- **Skills:** `bighearts-backend` → **`reglas-reservas.md`**, que ya especifica cómo se calcula un
  solapamiento y dónde están sus bordes · `bighearts-ui` → `voz-microcopy.md`.
- **Aplica en crear y en editar.** Si solo se valida al crear, se cuela por `PATCH`.

### Decisiones tomadas (2026-08-20)

**1. El solapamiento se valida contra las clases `PUBLISHED` del propio profesor.** Las canceladas
no cuentan: un aula cancelada no ocupa a nadie.

**2. Los bordes se tratan igual que en la regla del estudiante.** Una clase que termina a las 18:00
y otra que empieza a las 18:00 **no** se solapan. El intervalo es cerrado por la izquierda y abierto
por la derecha, exactamente como en `reglas-reservas.md` §4.

**3. La antelación mínima se deriva de la ventana de acceso, no es un número suelto.** Debe ser al
menos `ACCESS_WINDOW_MINUTES`, porque por debajo de eso el enlace se revelaría en el mismo instante
en que se publica la clase. Se propone **60 minutos**, configurable por entorno.

**4. La duración máxima se propone en 240 minutos** (cuatro horas). Configurable. _Propuesta mía:
no estaba decidida en ningún sitio._

**5. El profesor puede saltarse la antelación mínima, pero no el solapamiento.** Publicar con poca
antelación es una decisión suya que solo le afecta a él; solaparse consigo mismo es imposible. La
primera es un aviso que se puede confirmar; la segunda, un error que bloquea.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: los códigos `TEACHER_SCHEDULE_CONFLICT` y
      `CLASSROOM_DURATION_INVALID` en `ApiErrorCode`. Luego `npm run build:types`.
      **Ampliado (2026-08-24):** hizo falta un tercer código, `CLASSROOM_LEAD_TIME_WARNING`, más el
      flag `confirmarPocaAntelacion` en `CreateClassroomInput` y los tres tipos de `details`. Ver
      Notas de implementación.

### Backend

- [x] **T2** — `CLASS_MIN_LEAD_MINUTES` (60) y `CLASS_MAX_DURATION_MINUTES` (240) en
      `config/env.schema.ts` **y** en `.env.example`, con su comentario de por qué existen.
- [x] **T3** — Validar en `POST /classrooms` y en `PATCH /classrooms/:id` que el aula **no se
      solapa con otra `PUBLISHED` del mismo profesor**. Al editar, la propia aula se excluye de la
      comprobación. Responde `TEACHER_SCHEDULE_CONFLICT` con el título y el horario del aula que
      choca, para que el mensaje pueda ser útil.
      **Parcial (2026-08-24):** hecho en `POST` y con `excluirId` listo; el `PATCH` no puede mover
      el horario todavía (ver Notas y la decisión de la capa `contrato` sobre AC8).
- [x] **T4** — Validar `durationMinutes` contra el máximo → `CLASSROOM_DURATION_INVALID`.
- [x] **T5** — Validar la antelación mínima. **Es un aviso, no un bloqueo**: la petición se acepta
      si trae la confirmación explícita del profesor; sin ella, responde el aviso.
- [x] **T6** — Tests: solapamiento exacto, parcial y **en el borde** (18:00 fin / 18:00 inicio, que
      **sí** debe permitirse); las canceladas no cuentan; editar un aula sin moverla no choca
      consigo misma; duración por encima del máximo; antelación por debajo del mínimo con y sin
      confirmación.

### Frontend

- [x] **T7** — El error de solapamiento se pinta junto al campo de horario y **nombra la clase que
      choca**: `Ya tienes «Conversación cotidiana» el martes 25 a las 6:00 p. m.` Un error que no
      dice con qué chocas obliga a buscarlo a mano.
- [x] **T8** — El aviso de poca antelación se confirma con `AlertDialog` **con verbos**:
      `Publicar de todas formas` / `Cambiar la hora`. Explica la consecuencia: los estudiantes
      recibirán el recordatorio tarde o no lo recibirán.
- [x] **T9** — Duración con un máximo también en el control del formulario, no solo en el servidor.
- [x] **T10** — Tests: los tres errores se pintan bajo su campo con ícono; el diálogo de
      confirmación atrapa el foco y se cierra con `Esc`; `axe` limpio.

### Documentación

- [x] **T11** — Añadir la regla de no-solapamiento **del profesor** a `ARQUITECTURA.md` §4.4, que
      hoy solo contempla la del estudiante. Recorrer la tabla de §6 del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [x] **AC1** — Un profesor con una clase el martes de 18:00 a 19:00 **no puede** crear otra el
      martes de 18:30 a 19:30. Responde `TEACHER_SCHEDULE_CONFLICT`.
- [x] **AC2** — **Sí puede** crear una que empiece exactamente a las 19:00. El borde no cuenta como
      solapamiento.
- [x] **AC3** — Una clase **cancelada** no bloquea el horario: se puede publicar otra encima.
- [x] **AC4** — **Editar** un aula sin cambiar su horario no falla por chocar consigo misma.
- [x] **AC5** — El error de solapamiento **nombra la clase y el horario** con los que choca, no solo
      dice que hay conflicto.
- [x] **AC6** — Una duración por encima del máximo responde `CLASSROOM_DURATION_INVALID`, y el
      control del formulario tampoco la deja escribir.
- [x] **AC7** — Publicar con menos de la antelación mínima **abre un diálogo de confirmación con
      verbos** que explica la consecuencia. Confirmando, se publica. Es aviso, no bloqueo.
- [x] **AC8** — Las tres reglas se aplican **también en `PATCH`**, no solo al crear. Verificado con
      tests de backend.
      **Cerrado por HU-202**: `editar()` llama a `assertCoherenciaTemporal({ …, excluirId: id })`
      cuando `scheduledAt` o `durationMinutes` cambian.
- [x] **AC9** — **Accesibilidad:** cada error junto a su campo con `aria-invalid` +
      `aria-describedby` + ícono; el diálogo atrapa el foco y se cierra con `Esc`; `axe` limpio.
- [x] **AC10** — **Verificación automática:** `typecheck`, `lint`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Solapamiento entre profesores distintos.** Dos clases a la vez de dos profesores es normal y
  deseable.
- **No solapamiento del estudiante** → ya está en `ARQUITECTURA.md` §4.4, se implementa en Sprint 3
  con las reservas.
- **Avisar al profesor de choques con clases de otros** en el catálogo. HU-208 le da la vista para
  mirarlo; automatizarlo es otra HU.
- Sugerir huecos libres o proponer horarios alternativos.
- Límite de clases por día o por semana.

## Notas de implementación

### Capa `contrato` — 2026-08-24

**Hecho.** Tres códigos en `ApiErrorCode` (no dos), `confirmarPocaAntelacion?: boolean` en
`CreateClassroomInput`, tres interfaces de `details` (`TeacherScheduleConflictDetails`,
`ClassroomDurationInvalidDetails`, `ClassroomLeadTimeWarningDetails`) y dos constantes
`CLASS_MIN_LEAD_MINUTES_DEFAULT` / `CLASS_MAX_DURATION_MINUTES_DEFAULT`. `build:types` y los 47
tests del paquete en verde.

**Dos decisiones que la HU no traía, consultadas y aprobadas:**

1. **El aviso necesita código propio: `CLASSROOM_LEAD_TIME_WARNING` (409).** T1 solo pedía dos
   códigos, pero `contrato-api.md` §3 prohíbe que el frontend ramifique por el `message`, y AC7
   necesita distinguir el aviso para abrir el `AlertDialog`. La confirmación viaja **en el cuerpo**
   (`confirmarPocaAntelacion: true`), no como query: ningún `POST` del repo mezcla cuerpo y query.
2. **AC8 no es alcanzable en esta HU y no se fuerza.** `PATCH /classrooms/:id` sigue acotado a los 5
   campos de accesibilidad (D25): no acepta `scheduledAt` ni `durationMinutes`, así que las tres
   reglas no pueden dispararse por ahí. **El contrato del `PATCH` queda intacto**; quien lo extiende
   es HU-202. AC8 se cerrará **parcial**.

**Para la capa `backend`:**

- Las tres validaciones van en un **módulo de reglas puro y reutilizable** (p. ej.
  `classrooms/coherencia-temporal.rules.ts`), invocado desde `crear()` en esta HU. HU-202 lo
  invocará desde `editar()` sin escribir lógica nueva — de ahí que la firma del solapamiento tenga
  que aceptar ya un `excluirId` (el aula que se edita no choca consigo misma, AC4).
- `T2` sigue vigente tal cual: `CLASS_MIN_LEAD_MINUTES` (60) y `CLASS_MAX_DURATION_MINUTES` (240) en
  `env.schema.ts` y `.env.example`. **Las constantes de `@academia/types` son el valor de fábrica
  para el formulario, no la autoridad**: el servidor manda y devuelve su número real en `details`.
- El error de solapamiento tiene que rellenar los cuatro campos de `TeacherScheduleConflictDetails`.
  `meetingLink` no viaja ahí, aunque el aula sea del propio profesor (§4.8 regla 2).
- **T11 está casi hecho de antes:** `ARQUITECTURA.md` §4.4 ya contiene la regla del profesor, la
  antelación mínima y la duración máxima. Falta recorrer la tabla de §6 de `bighearts-dod`.

### Capa `backend` — 2026-08-24

**Hecho.** T2–T6. Las tres reglas viven en `classrooms/coherencia-temporal.rules.ts` (funciones
puras, 15 tests propios) y las orquesta `ClassroomsService.assertCoherenciaTemporal()`, **público y
con `excluirId` desde ya** para que HU-202 lo llame desde `editar()` sin escribir lógica nueva. Los
336 tests de la API en verde y `typecheck` limpio.

**Tres decisiones que la HU no traía:**

1. **El filtro global se tragaba el `details`.** `all-exceptions.filter.ts` solo reenviaba
   `details` si el cuerpo traía `fields` (validación), así que el `details` de un error de dominio
   se perdía en silencio y AC5 no habría llegado nunca al navegador. Se añadió la segunda rama, con
   su propio spec (`all-exceptions.filter.spec.ts`, que antes no existía).
2. **El orden de las tres reglas: duración → solapamiento → aviso de antelación.** La duración va
   primero porque sin ella el intervalo del solapamiento no significa nada; el aviso va el último
   porque pedirle al profesor que confirme una clase que iba a ser rechazada por solaparse sería
   hacerle decidir sobre algo inexistente. Hay un test que fija ese orden.
3. **El solapamiento se decide en memoria, no en SQL.** La consulta trae las aulas `PUBLISHED` del
   profesor con `scheduledAt < fin` —un superconjunto exacto, sin suponer nada sobre lo que duran
   las filas ya guardadas— y el cruce lo decide `seSolapan()`. Prisma no filtra por
   `scheduledAt + durationMinutes` (expresión sobre dos columnas) y con `$queryRaw` el borde del
   AC2 quedaría dentro de una cadena SQL que ningún test unitario recorre. Sin transacción: no hay
   contador que mutar ni dos actores compitiendo. Queda documentada la carrera teórica (el mismo
   profesor desde dos pestañas) y que su respuesta correcta sería un `EXCLUDE USING gist`, no un
   lock.

**Para la capa `frontend`:**

- `POST /classrooms` responde ahora tres códigos nuevos: `CLASSROOM_DURATION_INVALID` (**400**),
  `TEACHER_SCHEDULE_CONFLICT` (409) y `CLASSROOM_LEAD_TIME_WARNING` (409). Los tres llegan con su
  `details` tipado en `error.details` — ojo, el 400 de duración **no** es un `VALIDATION_ERROR` y no
  trae `fields`, así que el formulario tiene que pintarlo bajo el campo por su código.
- El reintento del aviso es **la misma petición con `confirmarPocaAntelacion: true` en el cuerpo**.
  Ese flag no salta el solapamiento ni la duración: hay un test que lo fija.
- **Los umbrales que muestre la UI salen de `details`, no de las constantes.**
  `CLASS_MAX_DURATION_MINUTES_DEFAULT` sirve como `max` inicial del control (AC6, T9), pero si el
  servidor responde `maximoMinutos: 90` manda ese.
- `ARQUITECTURA.md` §6.4 y `contrato-api.md` ya recogen las dos variables nuevas. De T11 solo queda
  recorrer la tabla de §6 de `bighearts-dod`, en la capa `cierre`.

### Capa `frontend` — 2026-08-24

**Hecho.** T7–T10, todo dentro de `features/aulas`. El solapamiento se pinta bajo **«Día»** —el
mismo campo al que ya se traducía el `scheduledAt` del backend— con el aula nombrada y su intervalo
completo (`describirRangoHorario`, nuevo en `lib/horario.ts`). El aviso de antelación abre
`components/dialogo-poca-antelacion.tsx`. La duración se acota con `duracionesHasta()` en
`lib/niveles.ts`. Los 35 tests de `formulario-aula.spec.tsx` en verde, más 3 specs de librería
(`coherencia-temporal`, `niveles`, `horario`); `typecheck` y `eslint` limpios.

**Cuatro decisiones que la HU no traía:**

1. **El `details` se valida antes de usarse** (`lib/coherencia-temporal.ts`). `ApiClientError.details`
   es un `Record<string, unknown>` —lo que llegó por la red—, y un `as` a secas habría puesto un
   `undefined` en mitad del mensaje que lee el profesor el día que API y web se desplieguen
   desincronizadas. Si la forma no cuadra, se cae al `message` del servidor.
2. **El error de solapamiento va bajo «Día» y no repetido bajo «Hora de inicio».** El choque es del
   instante, y el instante en pantalla empieza en ese campo; duplicar un mensaje que ya es largo por
   nombrar el aula solo lo haría más ruidoso. El foco aterriza ahí.
3. **`CLASSROOM_DURATION_INVALID` recorta el `<select>` y reajusta el valor.** Si el servidor
   responde un tope menor, las opciones se filtran a él y la duración rechazada pasa a la mayor
   permitida — dejarla sin opción coincidente habría dejado el control en blanco. `duracionesHasta`
   nunca devuelve lista vacía.
4. **El diálogo no tiene `Trigger`, y su apertura viaja en un estado aparte del contenido.** Lo abre
   la respuesta del servidor; el `aviso` no se vacía al decidir para que la transición de salida no
   ocurra sobre un diálogo sin texto. `finalFocus` es una función que comprueba `isConnected`: al
   publicar con éxito la pantalla ya navegó y `<PaginaCabecera>` está moviendo el foco a su `<h1>`.

**Dos cosas que la capa `cierre` tiene que saber:**

- **El docblock de `components/ui/alert-dialog.tsx` decía que el diálogo no se cierra con `Esc`, y
  es falso**: Base UI solo bloquea el cierre por clic fuera. Se corrigió el comentario, porque AC9
  exige justo lo contrario y había un test nuevo que lo demuestra.
- **La vuelta del foco al primer botón tras el último `Tab` no se puede testear en jsdom**: la hace
  un guardián de foco que necesita un `focus` real de navegador. El test comprueba lo que sí rompe
  si alguien quita el `modal`: que el foco nunca cae en el formulario y que la página de detrás
  queda `aria-hidden`. **El ciclo completo con teclado hay que verlo a ojo en el navegador**, junto
  con `.dark` y `.hc`.

### Capa `cierre` — 2026-08-24

**Verificación completa en verde, una sola pasada:** `typecheck` (3 workspaces), `lint` (0 errores;
quedan 7 warnings de `react-refresh/only-export-components`, todos preexistentes en ficheros de
`components/ui/`), `build` (3 workspaces) y `npm run test` — **980 tests**: 336 API + 597 web + 47
types. Los 10 AC recorridos uno a uno: **9 cumplen, AC8 parcial** por la razón que ya anticipó la
capa `contrato` y que ahora queda escrita en el propio AC.

**T11 cerrado.** `ARQUITECTURA.md` §4.4 y §6.4 y `contrato-api.md` ya venían de las capas
anteriores; al recorrer la tabla de §6 del skill `bighearts-dod` faltaban tres:

1. **`DEFINICION_PROYECTO.md` §4.3** no conocía ninguna de las tres reglas. Se añaden como **quinta
   regla, explícitamente _no_ diferencial** — no venden el producto, evitan que se rompa—, para no
   tocar la lista de cuatro que el documento usa como argumento de venta.
2. **`bighearts-ui` → `patrones-dominio.md`** solo tenía `AlertDialog` para acciones destructivas.
   Se documenta el patrón nuevo: **confirmar un aviso del servidor** (diálogo sin `Trigger`, abierto
   por la respuesta; confirmar = reenviar la misma petición con el acuse; los umbrales salen del
   `details`, nunca de una constante del frontend).
3. **`bighearts-dod` §5** daba a entender que un diálogo modal se testea entero en jsdom. Se añade
   qué parte no se puede (el ciclo de `Tab`, que necesita un `focus` de navegador real) y qué se
   testea en su lugar.

**Lo que queda pendiente, y no es un olvido:**

- **AC8**, parcial y con dueño: HU-202. La deuda está escrita en sus _Decisiones de auditoría_ con
  la llamada exacta que tiene que hacer, para que no dependa de que alguien recuerde esta HU.
- **La revisión a ojo en el navegador**: `.dark`, `.hc` y el ciclo completo de `Tab` dentro del
  diálogo. jsdom no calcula CSS y el guardián de foco necesita un navegador real; los tests cubren
  lo que sí rompe (el foco nunca cae en el formulario, la pantalla de detrás queda `aria-hidden`,
  `Esc` cierra y devuelve el foco a la hora).
- **La carrera teórica del solapamiento** —el mismo profesor publicando dos clases solapadas desde
  dos pestañas en el mismo milisegundo— sigue abierta a propósito: su respuesta correcta es un
  `EXCLUDE USING gist` sobre un `tstzrange`, que es su propia migración y su propia HU.
