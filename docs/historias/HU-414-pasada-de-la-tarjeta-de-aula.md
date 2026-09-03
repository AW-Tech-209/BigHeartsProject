# HU-414 — `<TarjetaAula>`: estados, cupos, fechas y microcopy

| Campo               | Valor                                              |
| ------------------- | -------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                          |
| **Prioridad**       | 🟠 Alta (la usan HU-412, HU-413 y más pantallas)   |
| **Estimación**      | 2 días                                             |
| **Estado**          | ⬜ Pendiente                                       |
| **Rama**            | `<nº-issue>-hu-414-pasada-de-la-tarjeta-de-aula`   |
| **Alcance técnico** | frontend                                           |
| **Depende de**      | HU-408 (identidad ya en `main`)                    |
| **Labels**          | `cierre-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** persona que escanea una lista de clases,
> **Quiero** que cada tarjeta se lea limpia —estado, fecha, modo, cupo— sin errores de redacción,
> **Para** decidir de un vistazo.

## Contexto

Pieza compartida del lote 2: `<TarjetaAula>` se pinta en el catálogo, en el panel del profesor, en
el detalle y en el historial, así que se pule **una vez**. Lo que el mockup y una lectura rápida
del código dejan ver:

- **Microcopy:** «Quedan **1 cupos**» (debe ser «1 cupo»); el chip «Modo sin indicar»; revisar
  los nueve textos de `<EstadoAula>` contra `voz-microcopy.md`.
- **Fechas:** se parten feo — «(hora estándar de Colombia)» cae sola en una segunda línea. Fijar
  el formato completo del skill (`Martes 12 de agosto, 6:00 p.m. (hora de Colombia)`) sin huérfanas.
- **Chips de modo de comunicación:** disposición y envoltura coherentes; que no descuadren la
  altura de la tarjeta.
- **Estado + «Tu clase» + acción:** jerarquía clara (el riel de 4px, el badge de estado, el badge
  `Tu clase` y la acción «Gestionar mi clase» / «Editar clase»).

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` → `patrones-dominio.md` (`<EstadoAula>`, riel de
  estado, `<IndicadorCupo>`, tarjeta por perspectiva y rol), `layout-y-composicion.md` (anatomía de
  tarjeta y su orden DOM), `voz-microcopy.md` (fechas completas, español literal).
- **Reutiliza / toca:** `components/dominio/tarjeta-aula.tsx`, `estado-aula.tsx` +
  `estado-aula-variantes.ts`, `indicador-cupo.tsx`, `modo-comunicacion-badge.tsx`,
  `features/aulas/lib/` (formato de fecha y de nivel).
- **Decisiones pendientes que bloquean esta HU:** ninguna.
- **Bloquea (recomendado mergear antes):** HU-412, HU-413.

## 🔧 Tasks

### Frontend

- [ ] **T1** — Pluralización de cupos: `Quedan {n} cupo` / `Quedan {n} cupos` en `<EstadoAula>` y
      en `<IndicadorCupo>`. Función pura en `features/aulas/lib/` con su `*.spec.ts`.
- [ ] **T2** — Formato de fecha/hora: una función pura que devuelva la fecha completa del skill sin
      que la zona quede huérfana en su línea (`text-balance` / `text-pretty` o el corte controlado).
      Con su `*.spec.ts` (zona fija en el test).
- [ ] **T3** — Pasada de microcopy a los nueve textos de `<EstadoAula>` y al chip «Modo sin
      indicar» contra `voz-microcopy.md`. Ajustar los que no cumplan.
- [ ] **T4** — Chips de modo de comunicación (`modo-comunicacion-badge`): disposición y envoltura
      coherentes; contribución a la altura de la tarjeta acotada.
- [ ] **T5** — Jerarquía visual de la tarjeta: riel de 4px + badge de estado + badge `Tu clase` +
      acción, según `patrones-dominio.md` §4; orden DOM del skill (fecha → `<h3>` → subtítulo →
      estado) intacto.

### Documentación

- [ ] **T6** — `bighearts-ui` → `patrones-dominio.md` (fila `ultimos-cupos`: texto con
      pluralización) y `voz-microcopy.md` si se fija regla de formato de fecha. Tests:
      `estado-aula-variantes.spec.tsx`, `tarjeta-aula.spec.tsx`, `indicador-cupo.spec.tsx` en verde.

## ✅ Criterios de aceptación

- [ ] **AC1** — Con 1 cupo libre el texto es «Quedan 1 cupo» (singular); con 2+ es «Quedan {n}
      cupos». Verificado con la función pura y su `*.spec.ts`, y en `<EstadoAula>` / `<IndicadorCupo>`.
- [ ] **AC2** — La fecha se pinta completa y con zona explícita, y la zona **no** queda sola en una
      línea a los anchos de 1 / 2 / 3 columnas. Verificado con la función de formato (test con zona
      fija) y a ojo.
- [ ] **AC3** — Los nueve estados de `<EstadoAula>` conservan **color + ícono + texto** (triple
      codificación) y la regla del sólido (solo `acceso-abierto` y `en-curso` en color pleno); el
      copy cumple `voz-microcopy.md`. Verificado con `estado-aula-variantes.spec.tsx`.
- [ ] **AC4** — En una fila, dos tarjetas con distinto número de chips de modo tienen la misma
      altura. El riel de 4px sigue mostrando el estado en `.hc`.
- [ ] **AC5** — `axe` limpio en `tarjeta-aula.spec.tsx` en los tres temas; el orden de encabezados
      (`<h1>` de página → `<h3>` de tarjeta) no rompe `heading-order`. Cero colores literales en `.tsx`.
- [ ] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces) en verde.

## 🚫 Fuera de alcance

- La composición del catálogo y de sus filtros → **HU-412**.
- La composición del panel → **HU-413**.
- `<VentanaDeAcceso>` y el detalle del aula (HU-204) más allá de que la tarjeta siga encajando.
- Cambios en el contrato (`ClassroomListItem`, `derivarEstadoAula`) o en la API.

## Notas de implementación

Sin desviaciones previstas.
