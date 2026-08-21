# HU-211 — El aula declara cómo se imparte

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                         |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 2.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Rama**            | `hu-211-accesibilidad-declarada-del-aula-<persona>` |
| **Alcance técnico** | fullstack                                           |
| **Depende de**      | HU-201 (✅), HU-203 (✅), HU-204                    |
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

## 🔧 Tasks

### Contrato — va primero

- [ ] **T1** — En `packages/types`: `communicationModes: CommunicationPreference[]` en `Classroom`,
      los tres apoyos booleanos (`hasInterpreter`, `hasLiveCaptions`, `hasVisualMaterials`), el
      filtro por modo, y una función pura `coincideConLaPreferencia(aula, preferencia)` **con sus
      tests**. Enums espejo en `schema.prisma`. Luego `npm run build:types`.

### Backend

- [ ] **T2** — Migración de Prisma: los campos nuevos en `Classroom`. `communicationModes` como
      array de enum, **sin valor por defecto** para las filas existentes. Los tres booleanos a
      `false`.
- [ ] **T3** — `POST /classrooms`: `communicationModes` **obligatorio y no vacío** en las aulas
      nuevas. Los apoyos, opcionales.
- [ ] **T4** — `PATCH /classrooms/:id`: permite completar y cambiar estos campos. Es la vía por la
      que un aula antigua deja de estar «sin indicar».
- [ ] **T5** — `GET /classrooms`: filtro opcional por modo de comunicación, combinable con los de
      nivel y fecha.
- [ ] **T6** — Los campos viajan en listado y en detalle. **No** son sensibles: no aplica la regla
      del `meetingLink`.
- [ ] **T7** — Tests: crear sin modos responde `VALIDATION_ERROR`; el filtro devuelve lo correcto y
      combina con los demás; un aula antigua sin modos se sirve sin romper.

### Frontend

- [ ] **T8** — Sección de accesibilidad en el formulario de crear y editar: modos —selección
      múltiple, **obligatoria**— y los tres apoyos. Cada opción con su etiqueta en español
      completa, sin abreviar.
- [ ] **T9** — Selector de plataforma de la videollamada (Zoom · Meet · Otra) junto al campo del
      enlace, con la ayuda de por qué se pregunta.
- [ ] **T10** — `<TarjetaAula>` muestra el modo principal con **color + ícono + texto**. Si el aula
      no lo tiene indicado, lo dice: `Modo sin indicar`.
- [ ] **T11** — El detalle (HU-204) muestra el bloque completo: todos los modos, los apoyos activos
      y la plataforma.
- [ ] **T12** — **Marca de coincidencia** en las clases que encajan con la preferencia del
      estudiante: `Coincide con tu preferencia`, con ícono y texto. Nunca marca las que no encajan
      como si estuvieran vetadas.
- [ ] **T13** — Filtro por modo en el catálogo, **desactivado por defecto**, con su estado en la
      URL.
- [ ] **T14** — Si el estudiante no declaró preferencia —es opcional—, no se marca nada y se le
      ofrece completarla desde su perfil **una sola vez, sin insistir**.
- [ ] **T15** — En Mis aulas, el profesor ve cuáles de sus aulas están «sin indicar» y puede
      completarlas.
- [ ] **T16** — Tests: la marca aparece y desaparece según la preferencia; el filtro no viene
      puesto; un aula sin modos se pinta sin romper; `axe` limpio; los tres temas.

### Documentación

- [ ] **T17** — Actualizar `ARQUITECTURA.md` §7.2 con los campos nuevos, y recorrer la tabla de §6
      del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [ ] **AC1** — **No se puede crear un aula sin declarar al menos un modo de comunicación.** Enviar
      el formulario sin ninguno responde `VALIDATION_ERROR` y el error se pinta bajo el campo.
- [ ] **AC2** — Un aula puede declarar **varios modos a la vez**, y todos se ven en el detalle.
- [ ] **AC3** — El modo aparece en la tarjeta del catálogo con **color + ícono + texto**, legible
      sin depender del color.
- [ ] **AC4** — Un estudiante con preferencia `SIGN_LANGUAGE` ve marcadas `Coincide con tu
preferencia` **solo** las clases que incluyen ese modo. Las demás siguen visibles y
      reservables, **sin marca negativa de ningún tipo**.
- [ ] **AC5** — **El catálogo no filtra por defecto.** Al entrar, el estudiante ve todas las clases.
      El filtro por modo existe y hay que activarlo a mano.
- [ ] **AC6** — Un estudiante **sin preferencia declarada** no ve ninguna marca y la pantalla no le
      reclama nada de forma repetida.
- [ ] **AC7** — **Un aula creada antes de esta HU se sigue mostrando sin romper**, con
      `Modo sin indicar`, y el profesor puede completarla desde Mis aulas. La migración **no** le
      asigna un modo inventado.
- [ ] **AC8** — El detalle muestra la plataforma de la videollamada (Zoom · Meet · Otra).
- [ ] **AC9** — El filtro por modo se combina con los de nivel y fecha, y queda en la URL.
- [ ] **AC10** — **Microcopy:** ningún texto sugiere que una clase esté vetada para el usuario.
      Revisado contra `voz-microcopy.md`: informa, no excluye.
- [ ] **AC11** — **Accesibilidad:** la selección múltiple de modos se completa solo con teclado con
      foco visible, cada opción tiene etiqueta visible, `axe` limpio, y funciona en `light`, `dark`
      y `hc`.
- [ ] **AC12** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
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

_Se rellena al cerrar._
