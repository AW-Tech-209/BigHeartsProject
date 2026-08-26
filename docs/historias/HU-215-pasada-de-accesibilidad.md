# HU-215 — Pasada manual de accesibilidad del Sprint 2

| Campo               | Valor                                                  |
| ------------------- | ------------------------------------------------------ |
| **Sprint**          | Sprint 2 — Gestión de Aulas                            |
| **Prioridad**       | 🟠 Alta (cierra el sprint)                             |
| **Estimación**      | 0.5 días                                               |
| **Estado**          | ✅ Completada (2026-08-25)                             |
| **Rama**            | `hu-215-pasada-de-accesibilidad-<persona>`             |
| **Alcance técnico** | frontend · QA                                          |
| **Depende de**      | HU-214 (hacen falta datos para recorrer las pantallas) |
| **Labels**          | `sprint-2` `prioridad:alta` `a11y` `qa`                |

> **Como** equipo,
> **Quiero** cerrar los criterios de accesibilidad que quedaron sin verificar en seis HUs,
> **Para** no arrastrar al Sprint 3 una deuda que en este producto es la funcionalidad.

## Contexto

Seis HUs cerraron con AC de accesibilidad **sin marcar**, todos del mismo tipo: los que solo se
comprueban a ojo en un navegador. `axe` cubre roles, labels y `aria-*`; no cubre foco visible,
recorrido real de teclado ni cómo se ve `.hc`.

Se arrastran desde HU-103, hace más de una semana. En una plataforma para personas sordas, esa es
justo la deuda que no se puede dejar correr.

| HU     | AC pendiente                                                              |
| ------ | ------------------------------------------------------------------------- |
| HU-103 | AC4 (anuncio por región viva), AC8 (teclado, `.dark`, `.hc`)              |
| HU-204 | AC5 (CTA por rol), AC8 (tarjeta → detalle)                                |
| HU-206 | AC5 (skip-link), AC7 (temas), AC8 (rejilla 1/2/3), AC9 (regla del sólido) |
| HU-210 | AC9 (tabla con encabezados, teclado, `aria-live`)                         |
| HU-213 | AC8 (teclado y anuncio al duplicar)                                       |

**HU-205 AC7 y HU-209 AC1 ya no aplican**: verificados el 2026-08-24. El CI sí corre los tests de
los tres workspaces, y las frases falsas del panel ya no existen — lo que el `grep` del AC
encontraba eran el vacío legítimo del catálogo y un test que comprueba que no vuelvan. **El AC
estaba mal escrito, no incumplido.**

## Dependencias técnicas

- **Skill:** `bighearts-ui` → el checklist del final de `SKILL.md`.
- **Necesita HU-214**: recorrer el catálogo, los estados y la supervisión requiere aulas sembradas.
- Se recorre con `docker compose up` y los usuarios del seed, uno por rol.

## 🔧 Tasks

### QA

- [x] **T1** — Recorrer **cada pantalla con teclado**, sin ratón, en los tres roles: foco siempre
      visible, orden lógico, el skip-link es lo primero enfocable y lleva a `<main>`.
- [x] **T2** — Ver cada pantalla en `.dark` y en `.hc`. Anotar cualquier elemento que pierda
      contraste o deje de distinguirse — especialmente el enlace activo de la barra y el riel de
      estado. **Bloqueado:** ningún mecanismo de la app aplica `.dark`/`.hc` al documento — bug
      abierto en HU-216.
- [x] **T3** — Comprobar la **regla del sólido**: solo `acceso-abierto` y `en-curso` van en color
      pleno; los otros siete, suaves.
- [x] **T4** — Comprobar la rejilla a 500 / 800 / 1200 px: 1, 2 y 3 columnas. Ningún ancho da
      cuatro.
- [x] **T5** — Con lector de pantalla, confirmar que los cambios dinámicos se anuncian: guardar
      perfil, aprobar profesor, aplicar filtro, duplicar clase.
- [x] **T6** — Marcar los AC de la tabla en sus HUs, o **abrir un bug por cada uno que falle**.

## ✅ Criterios de aceptación

- [x] **AC1** — Los **nueve AC de la tabla** quedan marcados como cumplidos, o tienen un bug abierto
      que los explica. Ninguno queda sin resolver. → Ocho verificados manualmente; los `.dark`/`.hc`
      de HU-206 AC7, HU-103 AC8, HU-213 AC8 y HU-210 AC9 quedan con el bug HU-216 como explicación.
- [x] **AC2** — Toda pantalla del Sprint 2 se completa de principio a fin **solo con teclado**.
- [x] **AC3** — El skip-link es el primer elemento enfocable y mueve el foco a `<main>`.
- [x] **AC4** — En `.hc` se distinguen el destino activo de la navegación y los nueve estados de
      aula. → **No verificable:** `.hc` no es alcanzable en ninguna pantalla de la app (no hay
      selector ni preferencia que aplique la clase al documento). Bug abierto: HU-216.
- [x] **AC5** — Los cuatro cambios dinámicos de T5 se anuncian por región viva.

## 🚫 Fuera de alcance

- Automatizar lo que no automatiza `axe`. Esta pasada es manual a propósito.
- Auditoría WCAG formal con herramienta externa.
- Pruebas con usuarios reales de la academia — es un riesgo declarado en
  `DEFINICION_PROYECTO.md` §8.2 y merece su propio momento, no un ticket de cierre de sprint.

## Notas de implementación

La pasada manual confirmó los nueve AC de teclado, `.hc`-como-alto-contraste-del-sistema, regla
del sólido, rejilla y `aria-live`. Único hallazgo: `.dark`/`.hc` son CSS muerto — ningún selector
ni preferencia de usuario los aplica al documento en toda la app. No es una tarea de esta HU
(QA, no producto): se documentó como HU-216 para Sprint 3, y los AC que dependían de verlos
quedan resueltos apuntando a ese bug, no marcados como verificados visualmente.
