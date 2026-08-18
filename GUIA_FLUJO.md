# Cómo trabajo en BigHearts

Guía para mí mismo dentro de seis meses. No explica el producto (eso es
`docs/DEFINICION_PROYECTO.md`) ni cómo está construido (`docs/ARQUITECTURA.md`): explica **cómo
opero el proyecto** con Claude Code.

El cambio respecto a antes: la documentación y las HUs **viven en el repo, en Markdown**. Claude
Code las lee solo, git las versiona, y ya no hay que subir un `.docx` a cada chat.

---

## El ciclo, de un vistazo

```
  chat de exploración  →  actualizo docs/ARQUITECTURA.md  →  genero HUs
          ↓                                                      ↓
   docs/historias/HU-XXX-*.md  ←──────────────────────────────────┘
          ↓
   rama hu-XXX-slug-yo  →  /hu docs/historias/HU-XXX-*.md  →  PR  →  merge
```

---

## 1. Empezar una fase nueva

1. **Chat de exploración** (aquí, en Cowork o en claude.ai — no en Claude Code). Conversar hasta
   que la fase esté clara: qué entra, qué no, qué decisiones técnicas hay que tomar.
2. **Volcar el resultado a los documentos del repo**, no a un `.docx` nuevo:
   - Cambia el alcance, el roadmap o una regla de negocio → `docs/DEFINICION_PROYECTO.md`.
   - Cambia el modelo de datos, el stack o una decisión técnica → `docs/ARQUITECTURA.md`, y añade
     la fila correspondiente en su tabla de decisiones (§2).
   - Si resolviste algo que estaba en **`docs/ARQUITECTURA.md` §14.6** (lo que sigue sin decidir),
     bórralo de esa lista y escríbelo donde corresponda. Esa lista es deuda visible: tiene que
     encoger.
3. **Generar las HUs** a partir del documento actualizado, con tasks y acceptance criteria.

> Los dos `.docx` originales son un **snapshot histórico**. No se vuelven a sincronizar. Si alguien
> no técnico necesita un Word, se genera desde el `.md` en ese momento y se olvida.

## 2. Guardar cada HU

Un archivo por HU en `docs/historias/`, con el formato de
[`docs/historias/_PLANTILLA.md`](./docs/historias/_PLANTILLA.md) y el nombre
`HU-XXX-slug-corto.md`. La convención completa está en
[`docs/historias/README.md`](./docs/historias/README.md).

Lo único que hay que cuidar al escribir la HU: que **los acceptance criteria sean verificables**.
El comando `/hu` los recorre uno por uno al final, así que un AC como "la reserva funciona bien" no
produce ninguna verificación útil. Hay ejemplos de bien y mal escritos en la plantilla.

### GitHub: el issue es un puntero, no una copia

**No copies el texto de la HU al issue.** Son dos fuentes de verdad y divergen — es exactamente lo
que pasó con los `.docx`. Y hay pruebas prácticas: cuando descubrí que HU-203 dependía de HU-205,
edité un archivo; con copia habrían sido dos, y una se olvida. Las _Notas de implementación_ se
escriben **al cerrar**, y nadie las va a copiar de vuelta. Y si los checkboxes de las tasks están
en los dos sitios, uno de los dos miente siempre.

Reparto por herramienta:

| GitHub (issue + Project)                           | El repo                                              |
| -------------------------------------------------- | ---------------------------------------------------- |
| Estado, responsable, sprint, prioridad, estimación | Contexto, tasks, criterios de aceptación, decisiones |
| Tablero, qué está en curso, qué bloquea a qué      | Versionado, referencias cruzadas, historial          |
| Coordinación con Dev A                             | Lo que Claude Code lee solo                          |

**Anatomía del issue** — cinco líneas, ni una más:

```
Título:  HU-201 · Crear aula virtual con enlace de reunión manual
Labels:  sprint-2, prioridad:critica, fullstack, a11y

Cuerpo:
  <la historia: Como… Quiero… Para…>

  📄 Tasks y criterios de aceptación:
  docs/historias/HU-201-crear-aula-virtual.md

  Depende de: HU-102, HU-104 · Bloquea: HU-202, HU-203
```

Los campos del Project (Sprint, Prioridad, Estimación, Assignee, Estado) se rellenan ahí, no en el
cuerpo.

**El issue, no una tarjeta suelta.** Mis ramas ya llevan el número de issue delante
(`8-hu-103-ver-y-editar-el-perfil-de-usuario-william`), así que el issue es la unidad de trabajo y
el Project es una vista sobre ellos. Eso me da el `Closes #8` automático en el PR y el nombre de
rama generado por GitHub.

Para no transcribir a mano cada sprint: `gh issue create --title "…" --label "…" --body "…"`
desde la terminal, en el mismo momento en que escribo el `.md`.

## 3. Desarrollar una HU

```bash
git checkout -b hu-301-reservar-cupo-william
```

En Claude Code:

```
/hu docs/historias/HU-301-reservar-cupo.md
```

El comando hace cinco fases: entender → planear → implementar → verificar → cerrar. Está en
[`.claude/commands/hu.md`](./.claude/commands/hu.md) si quiero cambiarlo.

### Qué se carga y qué no

|                                                                                                  | Cuándo                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                                                      | **Siempre.** Comandos, estructura, stack, trampas conocidas y los no-negociables en una línea cada uno. |
| `bighearts-ui`                                                                                   | Solo si la tarea toca pantalla, estilos o copy.                                                         |
| `bighearts-backend`                                                                              | Solo si la tarea toca servidor, endpoints, Prisma o reservas.                                           |
| `bighearts-dod`                                                                                  | Al cerrar una task o revisar un PR.                                                                     |
| `reglas-reservas.md`, `contrato-api.md`, `patrones-dominio.md`, `tokens.css`, `voz-microcopy.md` | Solo cuando el skill los pide, dentro de su dominio.                                                    |
| `docs/ARQUITECTURA.md`, `docs/DEFINICION_PROYECTO.md`                                            | Solo cuando la HU lo requiere. No están en contexto por defecto.                                        |

Ese es todo el truco del gasto de tokens: **`CLAUDE.md` es corto y enuncia; el detalle vive en
archivos que solo se abren cuando hacen falta.** Por eso `apps/web/UI_GUIDELINES.md` ya no tiene
contenido y **no debe volver a entrar en `CLAUDE.md`** con `@UI_GUIDELINES.md`: eran 900 líneas en
cada sesión, tocara UI o no.

### Cuándo usar modo plan

Modo plan (`Shift+Tab` dos veces) **antes** de implementar cuando:

- La HU toca **reservas o cupos**. Es la lógica que no puede fallar y la que más caro sale rehacer.
- La HU es **vertical** (tipos + backend + frontend): el orden importa y conviene verlo antes.
- Hay que **cambiar el esquema de Prisma**. Una migración mal pensada cuesta otra migración.
- La HU **contradice algo** de la arquitectura o de un skill. Ahí el plan es la conversación.

No hace falta para una HU de una sola capa con acceptance criteria claros: sale más caro planear
que hacerla.

## 4. Verificar que está terminada

La fase 4 de `/hu` recorre **cada acceptance criteria uno por uno**, citándolo, diciendo cómo lo
comprobó y dando un veredicto. Eso es lo que sustituye al "sí, ya está".

El checklist completo (comandos, tests, documentación) está en el skill `bighearts-dod`. Lo que
conviene recordar de él:

- `npm run test --workspace @academia/api` — **no hay tests de frontend**, no hay runner instalado.
  La verificación de UI es manual contra el checklist de `bighearts-ui`.
- Si la HU tocó `bookings`, **tiene que haber un test de concurrencia**.
- **Cambio de código ⇒ cambio de documentación, en el mismo PR.**

### Cuándo delegar la verificación a un subagente

Delega la fase 4 con el Task tool cuando el diff pase de unos pocos archivos o la HU tenga muchos
acceptance criteria. La razón no es ahorrar tiempo: es que **quien acaba de escribir el código es
el peor juez de si cumple**, porque ya decidió que sí. Un subagente que solo ve la HU y el diff, sin
el hilo de decisiones que llevó hasta ahí, encuentra lo que el hilo principal da por hecho.

Además el hilo principal termina largo, y una revisión al final de una ventana llena es peor que
una en contexto limpio.

Para una HU de dos archivos con tres AC, hacerlo en el hilo principal está bien.

## 5. Mantener esto vivo

Es lo que falló la vez pasada: los documentos se escribieron una vez y el repo siguió adelante sin
ellos. Un año después decían TypeORM en un proyecto con Prisma, y apuntaban a un archivo CSS que no
existía.

**La regla:** si tocas una convención que un documento o un skill describe, lo actualizas **en el
mismo PR**. La tabla de qué actualizar según qué tocaste está en `bighearts-dod` §6.

Y si te encuentras algo ya desactualizado que no es de tu task, **arréglalo igual** y menciónalo en
el PR. Cuesta cinco minutos ahora y una auditoría entera después.

### Señales de que algo se desalineó

- Claude Code propone un patrón que ya no usamos → `CLAUDE.md` o un skill quedó viejo.
- Un skill cita un archivo o una ruta que no existe → arréglalo ahí mismo.
- Un documento describe una decisión "pendiente" que ya tomaste → sácala de
  `docs/ARQUITECTURA.md` §14.6.
- Tienes que explicarle lo mismo a Claude Code en tres sesiones distintas → **eso pertenece a un
  skill o a `CLAUDE.md`**. Es la señal más fiable de todas.

### Cada cierto tiempo

Al cerrar un sprint, cinco minutos:

1. `docs/DEFINICION_PROYECTO.md` §5.3 — actualizar el estado de la fase.
2. `docs/historias/README.md` — actualizar la tabla de sprints.
3. `docs/ARQUITECTURA.md` §14.6 — ¿encogió la lista de decisiones pendientes?
4. ¿Algún skill quedó contradicho por el código de este sprint?

---

## Mapa de archivos

| Archivo                                      | Para qué                | Se edita…                                               |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| `CLAUDE.md`                                  | Contexto de toda sesión | Al cambiar un comando, la estructura o un no-negociable |
| `docs/DEFINICION_PROYECTO.md`                | Qué y por qué           | Al cambiar alcance o roadmap                            |
| `docs/ARQUITECTURA.md`                       | Cómo                    | Al tomar una decisión técnica                           |
| `docs/historias/`                            | Backlog vivo            | En cada HU nueva                                        |
| `.claude/skills/bighearts-ui/`               | Convenciones de UI      | Al fijar un patrón de interfaz                          |
| `.claude/skills/bighearts-backend/`          | Invariantes de servidor | Al fijar una regla de dominio                           |
| `.claude/skills/bighearts-dod/`              | Definición de terminado | Al cambiar cómo se verifica                             |
| `.claude/commands/hu.md`                     | El comando `/hu`        | Al cambiar el proceso de implementación                 |
| `README.md`, `AUTH_FLOW.md`, `DEPLOYMENT.md` | Operación técnica       | Como hasta ahora                                        |
