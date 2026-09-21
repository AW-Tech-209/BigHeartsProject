# HU-505 — El contrato de la clase accesible

| Campo               | Valor                                                         |
| ------------------- | ------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Auditoría                                       |
| **Prioridad**       | 🔴 Crítica (bloquea a las dos personas)                       |
| **Estimación**      | 0.5 días                                                      |
| **Estado**          | ⬜ Pendiente                                                  |
| **Asignada a**      | **A y B juntos** — se acuerda y se mergea antes de repartirse |
| **Rama**            | `hu-505-el-contrato-de-la-clase-accesible`                    |
| **Alcance técnico** | `packages/types`                                              |
| **Depende de**      | ninguna                                                       |
| **Labels**          | `post-fase-1` `prioridad:critica` `types` `contrato`          |

> **Como** equipo de dos,
> **Quiero** que el contrato de la accesibilidad del aula esté cerrado y publicado antes de empezar,
> **Para** que backend y frontend avancen en paralelo sin esperarse ni negociar la forma dos veces.

## Contexto

La auditoría del socio y su framework bilingüe-bicultural obligan a cambiar **cómo se clasifica una
clase**. Ese cambio toca el modelo, la API, el formulario, el catálogo, el detalle y la landing —
demasiadas superficies para una sola persona y demasiadas para tocarlas a la vez sin pisarse.

**Esta HU existe solo para desbloquear.** No cambia comportamiento: publica los tipos, los enums,
los códigos de error y las funciones puras que HU-506 (backend, A) y HU-507 (frontend, B) van a
consumir. En cuanto esté en `main`, las dos siguen sin volver a hablarse.

### Las cuatro decisiones que este contrato materializa

| #       | Decisión                                                                                                        | Qué implica                                                                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **D42** | Toda aula declara un **modo de instrucción obligatorio**: `LSC_NATIVA` o `INTERPRETE_LSC`.                      | El framework §2 dice que instrucción, interpretación y texto **no son intercambiables**. Una clase para personas sordas se imparte en LSC o con intérprete de LSC; todo lo demás es apoyo. |
| **D43** | Los apoyos son **opcionales y aparte**: lectura labial, texto escrito, subtítulos en vivo, materiales visuales. | Son añadidura, nunca el método. El framework §3 prohíbe la lectura labial como método principal. **`SPOKEN_AUDIO` desaparece del aula.**                                                   |
| **D44** | La preferencia del estudiante **se reenfoca** al mismo vocabulario.                                             | Hoy los dos lados hablan lenguas distintas. Si el aula declara modo de instrucción, la preferencia tiene que hablar de lo mismo o el emparejamiento es una tabla de conversión.            |
| **D45** | Solo se aceptan enlaces de **Zoom, Google Meet y Microsoft Teams**.                                             | Son los tres que ofrecen subtítulos en vivo. Si la clase ocurre fuera, al menos que ocurra donde el estudiante tiene esa red.                                                              |

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.9 (accesibilidad declarada del aula, que esta HU reescribe),
  D21 (por qué se reutilizaba el enum del estudiante).
- **Framework del socio:** §2 (los tres modos no son intercambiables), §3 (qué evitar).
- **Archivos:** solo `packages/types/`. **Ningún archivo de `apps/`.**
- **Decisiones pendientes:** ninguna. D42–D45 quedan tomadas aquí.

> **Terminología: se dice LSC.** La etiqueta actual es «Lengua de signos», que es el término de
> España. Este producto es colombiano y sus usuarios tienen como primera lengua la **Lengua de Señas
> Colombiana (LSC)** — que es como la nombra el framework del socio cinco veces. El cambio de
> etiqueta entra aquí, en el contrato, para que las dos apps lo hereden.

## 🔧 Tasks

### Contrato

- [x] **T1** — `InstructionMode` con dos valores: `LSC_NATIVA` e `INTERPRETE_LSC`. Documentar en el
      propio enum **por qué son dos y no una lista**: son experiencias pedagógicas distintas, no
      niveles de una escala.
- [x] **T2** — `ClassroomSupport` para los apoyos opcionales: lectura labial, texto escrito,
      subtítulos en vivo, materiales visuales. Sustituye a los tres booleanos y a los modos planos.
- [x] **T3** — Reenfocar la preferencia del estudiante al mismo vocabulario: qué instrucción
      prefiere y qué apoyos le importan. Dejar escrito el mapeo desde los valores viejos, que
      HU-506 usará para migrar.
- [x] **T4** — `esProveedorPermitido(url)`: **función pura** que valida el dominio del enlace contra
      Zoom, Meet y Teams, y devuelve cuál es. La usan el DTO del backend y el formulario del
      frontend — una sola regla, no dos que se desincronizan.
- [x] **T5** — Reescribir la función de emparejamiento aula ↔ estudiante contra el modelo nuevo, con
      sus tests. Es una función pura compartida, como `derivarEstadoAula()`.
- [x] **T6** — Códigos de error nuevos: modo de instrucción ausente, proveedor no permitido, y el
      de aula sin declarar que HU-506 necesita.
- [x] **T7** — Etiquetas en español, con **«Lengua de Señas Colombiana (LSC)»** en lugar de «Lengua
      de signos», y `npm run build:types`.

### Documentación

- [x] **T8** — Reescribir `ARQUITECTURA.md` §4.9 con el modelo nuevo y registrar **D42–D45**. La
      sección actual describe un modelo que deja de existir.

## ✅ Criterios de aceptación

- [x] **AC1** — `@academia/types` compila y exporta el modo de instrucción, los apoyos, la
      preferencia reenfocada, los códigos de error y las dos funciones puras.
- [x] **AC2** — `esProveedorPermitido()` acepta URLs de Zoom, Meet y Teams —incluidos sus dominios
      regionales y subdominios de empresa— y **rechaza cualquier otra**, con tests que lo
      demuestren.
- [x] **AC3** — La función de emparejamiento tiene tests propios que cubren: coincidencia exacta,
      aula con intérprete para quien prefiere LSC nativa, y aula sin declarar.
- [x] **AC4** — Ninguna etiqueta del contrato dice «Lengua de signos».
- [x] **AC5** — **Ningún archivo de `apps/api` ni `apps/web` cambia en esta HU.** Verificado por el
      diff.
- [x] **AC6** — `ARQUITECTURA.md` §4.9 describe el modelo nuevo, y D42–D45 están registradas.

## 🚫 Fuera de alcance

- **Tocar el backend o el frontend.** Eso es HU-506 y HU-507. Si esta HU toca `apps/`, deja de
  cumplir su función de desbloquear.
- **La migración de datos.** Aquí se define el mapeo; lo aplica HU-506.
- **Añadir más proveedores.** Tres, y la lista vive en el código, no en el entorno.

## Notas de implementación

Sin desviaciones.
