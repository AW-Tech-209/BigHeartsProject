# HU-211 — El aula declara cómo se imparte

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                         |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 2.5 días                                            |
| **Estado**          | ✅ Completo                                         |
| **Rama**            | `hu-211-accesibilidad-declarada-del-aula-<persona>` |
| **Alcance técnico** | fullstack                                           |
| **Depende de**      | HU-201 (✅), HU-203 (✅), HU-204 (✅)               |
| **Labels**          | `sprint-2` `prioridad:critica` `fullstack` `a11y`   |

> **Como** estudiante hipoacúsico o sordomudo,
> **Quiero** saber en qué modo se imparte cada clase antes de reservarla,
> **Para** elegir una que pueda seguir, en vez de descubrirlo cuando ya estoy dentro de la
> videollamada.

## Contexto

**Es la brecha más grande del Sprint 2, y no estaba en ninguna HU.**

`Classroom` no tiene **ni un solo campo** sobre cómo se comunica la clase. El estudiante declara en
el registro si su lengua es de señas, si lee los labios o si prefiere texto escrito
(`communicationPreference`), y **ese dato no se usa en ninguna parte del producto**. El catálogo
filtra por nivel y horario: exactamente lo que filtraría una academia de inglés para oyentes.

La consecuencia es concreta. Un estudiante cuyo primer idioma es la lengua de señas abre el
catálogo, ve seis clases y **no puede saber cuál puede seguir**. Su única forma de averiguarlo es
reservar y entrar a la videollamada.

Eso rompe la prueba definitiva de
[`DEFINICION_PROYECTO.md` §8.1](../DEFINICION_PROYECTO.md#81-el-indicador-que-más-importa) —_llega
a la videollamada sin pedirle ayuda a nadie_— un paso **antes** de la videollamada. Y deja al
producto entregando, en el Sprint 2, lo mismo que entregaría cualquier CRUD de aulas con buen
contraste.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.9 (accesibilidad declarada y emparejamiento),
  §7.2 (modelo `Classroom`), §7.3 (derivación de estados), §4.8 (visibilidad por rol).
- **Skills:** `bighearts-backend` → `contrato-api.md` · `bighearts-ui` →
  `layout-y-composicion.md` y **`voz-microcopy.md`** (el copy de esta HU es delicado: informa, no
  excluye).
- **Reutiliza:** el enum `CommunicationPreference` que ya existe en `@academia/types`, el formulario
  de HU-201, `<TarjetaAula>` y el detalle de HU-204.

### Decisiones tomadas (2026-08-20)

**1. Un aula soporta varios modos, no uno.** Una clase puede darse en lengua de señas **y** con
subtítulos en vivo. Por eso es un conjunto, no un valor único. Se reutiliza
`CommunicationPreference` para que el emparejamiento con la preferencia del estudiante sea directo:
`modosDelAula.includes(preferenciaDelEstudiante)`.

**2. Los apoyos son campos aparte del modo.** Una clase impartida en inglés hablado **con
intérprete de señas** no es lo mismo que una impartida directamente en señas. Se declaran por
separado: intérprete, subtítulos en vivo, materiales visuales de apoyo.

**3. La plataforma de la videollamada se declara.** `meetingProvider` existe y hoy siempre vale
`MANUAL`. Pasa a significar **a qué plataforma apunta el enlace** —Zoom, Meet u otra—, porque los
subtítulos automáticos no funcionan igual en todas y el estudiante necesita saberlo para prepararse.
El enlace se sigue pegando a mano; eso no cambia.

**4. No se filtra por defecto: se destaca.** El catálogo muestra **todas** las clases, y marca las
que coinciden con la preferencia del estudiante. **Ocultarle clases por su preferencia sería decidir
por él**, y este producto existe para lo contrario. El filtro está disponible; no viene puesto.

**5. Las aulas ya creadas quedan «sin indicar», no se les inventa un valor.** HU-201 ya está en
producción y puede haber aulas reales. La migración **no rellena** el campo con un valor por
defecto que sería mentira: quedan vacías, la interfaz dice `El profesor no lo ha indicado`, y el
profesor las completa desde Mis aulas.

### Decisión tomada al implementar (2026-08-21)

**6. `PATCH /classrooms/:id` nace acotado a los 5 campos de accesibilidad, no a la edición general
del aula.** Ver decisión D25 de `ARQUITECTURA.md` §7.2. HU-202 (editar/cancelar, todavía ⬜
pendiente) extiende este mismo endpoint con el resto de campos editables — no abre uno paralelo.
Introduce el código `CLASSROOM_FORBIDDEN` (403, no eres el dueño), que HU-202 reutilizará.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: `communicationModes: CommunicationPreference[]` en `Classroom`,
      los tres apoyos booleanos (`hasInterpreter`, `hasLiveCaptions`, `hasVisualMaterials`), el
      filtro por modo, y una función pura `coincideConLaPreferencia(aula, preferencia)` **con sus
      tests**. Enums espejo en `schema.prisma`. Luego `npm run build:types`.

### Backend

- [x] **T2** — Migración de Prisma: los campos nuevos en `Classroom`. `communicationModes` como
      array de enum, **sin valor por defecto inventado** para las filas existentes (quedan `[]`, no
      un modo). Los tres booleanos a `false`.
- [x] **T3** — `POST /classrooms`: `communicationModes` **obligatorio y no vacío** en las aulas
      nuevas. Los apoyos, opcionales.
- [x] **T4** — `PATCH /classrooms/:id`: permite completar y cambiar estos campos. Es la vía por la
      que un aula antigua deja de estar «sin indicar». **Acotado a los 5 campos de accesibilidad**
      (decisión 6, D25) — no es la edición general del aula, que trae HU-202.
- [x] **T5** — `GET /classrooms`: filtro opcional por modo de comunicación, combinable con los de
      nivel y fecha.
- [x] **T6** — Los campos viajan en listado y en detalle. **No** son sensibles: no aplica la regla
      del `meetingLink`.
- [x] **T7** — Tests: crear sin modos responde `VALIDATION_ERROR`; el filtro devuelve lo correcto y
      combina con los demás; un aula antigua sin modos se sirve sin romper.

### Frontend

- [x] **T8** — Sección de accesibilidad en el formulario de crear y editar: modos —selección
      múltiple, **obligatoria**— y los tres apoyos. Cada opción con su etiqueta en español
      completa, sin abreviar.
- [x] **T9** — Selector de plataforma de la videollamada (Zoom · Meet · Otra) junto al campo del
      enlace, con la ayuda de por qué se pregunta.
- [x] **T10** — `<TarjetaAula>` muestra el modo principal con **color + ícono + texto**. Si el aula
      no lo tiene indicado, lo dice: `Modo sin indicar`.
- [x] **T11** — El detalle (HU-204) muestra el bloque completo: todos los modos, los apoyos activos
      y la plataforma.
- [x] **T12** — **Marca de coincidencia** en las clases que encajan con la preferencia del
      estudiante: `Coincide con tu preferencia`, con ícono y texto. Nunca marca las que no encajan
      como si estuvieran vetadas.
- [x] **T13** — Filtro por modo en el catálogo, **desactivado por defecto**, con su estado en la
      URL.
- [x] **T14** — Si el estudiante no declaró preferencia —es opcional—, no se marca nada y se le
      ofrece completarla desde su perfil **una sola vez, sin insistir**.
- [x] **T15** — En Mis aulas, el profesor ve cuáles de sus aulas están «sin indicar» y puede
      completarlas.
- [x] **T16** — Tests: la marca aparece y desaparece según la preferencia; el filtro no viene
      puesto; un aula sin modos se pinta sin romper; `axe` limpio; los tres temas.

### Documentación

- [x] **T17** — Actualizar `ARQUITECTURA.md` §7.2 con los campos nuevos (y la decisión D25), y el
      contrato de `PATCH /classrooms/:id` en `contrato-api.md` del skill `bighearts-backend`.

## ✅ Criterios de aceptación

- [x] **AC1** — **No se puede crear un aula sin declarar al menos un modo de comunicación.** Enviar
      el formulario sin ninguno responde `VALIDATION_ERROR` y el error se pinta bajo el campo.
- [x] **AC2** — Un aula puede declarar **varios modos a la vez**, y todos se ven en el detalle.
- [x] **AC3** — El modo aparece en la tarjeta del catálogo con **color + ícono + texto**, legible
      sin depender del color.
- [x] **AC4** — Un estudiante con preferencia `SIGN_LANGUAGE` ve marcadas `Coincide con tu
preferencia` **solo** las clases que incluyen ese modo. Las demás siguen visibles y
      reservables, **sin marca negativa de ningún tipo**.
- [x] **AC5** — **El catálogo no filtra por defecto.** Al entrar, el estudiante ve todas las clases.
      El filtro por modo existe y hay que activarlo a mano.
- [x] **AC6** — Un estudiante **sin preferencia declarada** no ve ninguna marca y la pantalla no le
      reclama nada de forma repetida.
- [x] **AC7** — **Un aula creada antes de esta HU se sigue mostrando sin romper**, con
      `Modo sin indicar`, y el profesor puede completarla desde Mis aulas. La migración **no** le
      asigna un modo inventado.
- [x] **AC8** — El detalle muestra la plataforma de la videollamada (Zoom · Meet · Otra).
- [x] **AC9** — El filtro por modo se combina con los de nivel y fecha, y queda en la URL.
- [x] **AC10** — **Microcopy:** ningún texto sugiere que una clase esté vetada para el usuario.
      Revisado contra `voz-microcopy.md`: informa, no excluye.
- [x] **AC11** — **Accesibilidad:** la selección múltiple de modos se completa solo con teclado con
      foco visible, cada opción tiene etiqueta visible, `axe` limpio, y funciona en `light`, `dark`
      y `hc`.
- [x] **AC12** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Filtrar el catálogo por preferencia automáticamente.** Decisión 4: se destaca, no se decide por
  el usuario.
- **Verificar que el profesor cumple lo que declara.** Es una declaración de buena fe; la
  plataforma no la audita en Fase 1.
- **Emparejamiento por nivel de hipoacusia** (`hearingLossLevel`). Solo se usa la preferencia de
  comunicación.
- Recomendaciones o ranking personalizado de clases.
- Subtítulos generados por la plataforma: la videollamada ocurre fuera.
- Traducción a lengua de señas: Fase 3.

## Notas de implementación

- **`PATCH /classrooms/:id` se acotó a los 5 campos de accesibilidad** en vez de adelantar la
  edición general del aula que trae HU-202. Decisión confirmada con el usuario antes de escribir
  código (T4/decisión 6); documentada como D25 en `ARQUITECTURA.md` §7.2. Cuando se implemente
  HU-202, su `PATCH` debe **extender** este endpoint y su DTO, no crear una ruta paralela.
- **La migración de Prisma se generó y aplicó contra el Postgres local de Docker**, no contra la
  Supabase de `apps/api/.env` (esa es una base compartida). Quien despliegue a staging/producción
  necesita correr `npm run prisma:deploy` (o equivalente) ahí, con las migraciones ya versionadas en
  `apps/api/prisma/migrations/`.
- **`communicationModes` no lleva `NOT NULL` a nivel de columna**, a propósito: es el mismo patrón
  que usa Prisma para todos los campos de lista escalar (no genera esa restricción). Se verificó
  empíricamente que Prisma Client normaliza `NULL` a `[]` al leer, así que las aulas sembradas antes
  de esta HU se sirven como `communicationModes: []` — «sin indicar» — sin ningún caso especial en
  el código.
- **`meetingProvider: MANUAL` se reinterpreta como «Otra»** en vez de añadir un quinto valor al
  enum. El mecanismo (pegar el enlace a mano) no cambia; solo cambia qué pregunta responde el campo.
  `DAILY` sigue reservado, sin escritor, para cuando Fase 1.5 genere el enlace automáticamente.
- **No se completaron los AC pendientes de HU-202** (edición general, `CLASSROOM_NOT_EDITABLE`):
  siguen fuera de esta HU tal y como estaban antes.
- El microcopy (AC10) se revisó contra `voz-microcopy.md` por quien implementó, no por una segunda
  persona ni por un hablante nativo dedicado a esa revisión — si el equipo quiere una revisión de
  voz independiente, queda pendiente de pedirla.
