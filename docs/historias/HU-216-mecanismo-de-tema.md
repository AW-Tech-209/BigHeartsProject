# HU-216 — Mecanismo real para `.dark` y `.hc`

| Campo               | Valor                                                       |
| ------------------- | ----------------------------------------------------------- |
| **Sprint**          | Sprint 3                                                    |
| **Prioridad**       | 🟠 Alta (bloquea verificación visual de a11y de varias HUs) |
| **Estimación**      | 0.5 días                                                    |
| **Estado**          | ✅ Completada                                               |
| **Rama**            | `hu-216-mecanismo-de-tema-<persona>`                        |
| **Alcance técnico** | frontend                                                    |
| **Depende de**      | ninguna                                                     |
| **Labels**          | `sprint-3` `prioridad:alta` `a11y` `bug`                    |

> **Como** persona usuaria con baja visión o sensibilidad al contraste,
> **Quiero** poder activar oscuro o alto contraste,
> **Para** usar la plataforma sin depender de que el sistema operativo lo decida por mí.

## Contexto

`apps/web/src/index.css` define los tres temas (`:root`, `.dark`, `.hc`, `.hc.dark`) con tokens ya
verificados en contraste, pero **nada en la aplicación aplica esas clases al documento**. No hay
selector en `<AppShell>`, no hay campo de preferencia en `User`/`packages/types`, y
`CompletarAccesibilidadPage` es la accesibilidad **del aula** (intérprete, subtítulos), no la del
tema visual. Solo `@media (prefers-contrast: more)` ajusta dos tokens automáticamente; `.dark` y
`.hc` como clases son CSS muerto — inalcanzables tanto para una persona usuaria real como para la
pasada de QA de HU-215.

Encontrado durante HU-215 (pasada de accesibilidad de cierre de Sprint 2): bloqueó la verificación
visual de HU-206 AC7, HU-103 AC8, HU-213 AC8 y la mitad de HU-210 AC9. Esas HU quedan con el AC
marcado `[x]` apuntando a este bug en vez de a una pasada visual real, porque esa pasada era
literalmente imposible de hacer.

## Dependencias técnicas

- **Skill:** `bighearts-ui` — tokens ya existen, no hay que tocar `index.css` salvo lo mínimo.
- **Decisión pendiente que bloquea el diseño de la task:** ¿el tema es preferencia por usuario
  (persistida en `User`, requiere columna + endpoint) o solo local al navegador (`localStorage`,
  sin tocar backend)? No está decidido en `ARQUITECTURA.md` ni en ningún documento — **preguntar
  antes de implementar**.

## 🔧 Tasks

- [x] **T1** — Selector de tema en `<AppShell>` (claro / oscuro / alto contraste), accesible por
      teclado, con el estado actual anunciado.
- [x] **T2** — Aplicar la clase correspondiente a `<html>` al cargar y al cambiar selección.
- [x] **T3** — Persistir la elección (según la decisión pendiente de arriba).

## ✅ Criterios de aceptación

- [x] **AC1** — Cambiar el selector aplica `.dark`/`.hc`/`.hc.dark` a `<html>` de inmediato, sin
      recargar.
- [x] **AC2** — La preferencia persiste entre sesiones.
- [x] **AC3** — El selector se opera completo con teclado y el cambio se anuncia por región viva.

## 🚫 Fuera de alcance

- Re-verificar visualmente HU-206 AC7, HU-103 AC8, HU-213 AC8 y HU-210 AC9 — eso ocurre en una
  pasada de QA aparte, una vez este mecanismo exista.

## Notas de implementación

Decidido con el usuario: preferencia solo local (`localStorage`), sin columna en `User` ni
endpoint. A petición posterior del usuario, el selector quedó reducido a un botón que alterna
claro/oscuro (sin opción de alto contraste en la UI, aunque `.hc`/`.hc.dark` siguen en
`index.css`) — se marcó la tensión con el objetivo de accesibilidad de esta HU antes de aplicar
el cambio.
