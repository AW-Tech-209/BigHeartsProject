# HU-414 — `<TarjetaAula>`: estados, cupos, fechas y microcopy

| Campo               | Valor                                              |
| ------------------- | -------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                          |
| **Prioridad**       | 🟠 Alta (la usan HU-412, HU-413 y más pantallas)   |
| **Estimación**      | 2 días                                             |
| **Estado**          | ⬜ Pendiente                                       |
| **Rama**            | `118-hu-414-pasada-de-la-tarjeta-de-aula`          |
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

- [x] **T1** — Pluralización de cupos: `Quedan {n} cupo` / `Quedan {n} cupos` en `<EstadoAula>` y
      en `<IndicadorCupo>`. Función pura en `features/aulas/lib/` con su `*.spec.ts`.
- [x] **T2** — Formato de fecha/hora: una función pura que devuelva la fecha completa del skill sin
      que la zona quede huérfana en su línea (`text-balance` / `text-pretty` o el corte controlado).
      Con su `*.spec.ts` (zona fija en el test).
- [x] **T3** — Pasada de microcopy a los nueve textos de `<EstadoAula>` y al chip «Modo sin
      indicar» contra `voz-microcopy.md`. Ajustar los que no cumplan.
- [x] **T4** — Chips de modo de comunicación (`modo-comunicacion-badge`): disposición y envoltura
      coherentes; contribución a la altura de la tarjeta acotada.
- [x] **T5** — Jerarquía visual de la tarjeta: riel de 4px + badge de estado + badge `Tu clase` +
      acción, según `patrones-dominio.md` §4; orden DOM del skill (fecha → `<h3>` → subtítulo →
      estado) intacto.

### Documentación

- [x] **T6** — `bighearts-ui` → `patrones-dominio.md` (fila `ultimos-cupos`: texto con
      pluralización) y `voz-microcopy.md` si se fija regla de formato de fecha. Tests:
      `estado-aula-variantes.spec.tsx`, `tarjeta-aula.spec.tsx`, `indicador-cupo.spec.tsx` en verde.

## ✅ Criterios de aceptación

- [x] **AC1** — Con 1 cupo libre el texto es «Quedan 1 cupo» (singular); con 2+ es «Quedan {n}
      cupos». Verificado con la función pura y su `*.spec.ts`, y en `<EstadoAula>` / `<IndicadorCupo>`.
- [x] **AC2** — La fecha se pinta completa y con zona explícita, y la zona **no** queda sola en una
      línea a los anchos de 1 / 2 / 3 columnas. Verificado con la función de formato (test con zona
      fija) y a ojo.
- [x] **AC3** — Los nueve estados de `<EstadoAula>` conservan **color + ícono + texto** (triple
      codificación) y la regla del sólido (solo `acceso-abierto` y `en-curso` en color pleno); el
      copy cumple `voz-microcopy.md`. Verificado con `estado-aula-variantes.spec.tsx`.
- [x] **AC4** — En una fila, dos tarjetas con distinto número de chips de modo tienen la misma
      altura. El riel de 4px sigue mostrando el estado en `.hc`.
- [x] **AC5** — `axe` limpio en `tarjeta-aula.spec.tsx` en los tres temas; el orden de encabezados
      (`<h1>` de página → `<h3>` de tarjeta) no rompe `heading-order`. Cero colores literales en `.tsx`.
- [x] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces) en verde.

## 🚫 Fuera de alcance

- La composición del catálogo y de sus filtros → **HU-412**.
- La composición del panel → **HU-413**.
- `<VentanaDeAcceso>` y el detalle del aula (HU-204) más allá de que la tarjeta siga encajando.
- Cambios en el contrato (`ClassroomListItem`, `derivarEstadoAula`) o en la API.

## Recorrido de acceptance criteria

| AC  | Veredicto | Cómo se comprobó                                                                                                                                                                                                 |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | Cumple    | `features/aulas/lib/cupos.ts` (`pluralizarCupos`) con `cupos.spec.ts`. `estado-aula.spec.tsx` cubre «Quedan 1 cupo» / «Quedan 3 cupos»; `indicador-cupo.spec.tsx` el «· Quedan N cupos».                         |
| AC2 | Cumple    | `describirHorarioPartes()` en `horario.ts` con test (`cuando` sin `(`, `zona` no vacía, rearmadas == `describirHorario`). La tarjeta pinta la zona en un `<span whitespace-nowrap>` sobre `text-pretty`.         |
| AC3 | Cumple    | `estado-aula.spec.tsx` recorre los nueve estados (texto exacto) y `estado-aula-variantes.spec.tsx` la regla del sólido y los tonos. Copy revisado contra `voz-microcopy.md`: sin cambios salvo la pluralización. |
| AC4 | Cumple    | `<TarjetaAula>` ahora es `flex h-full flex-col` y `<RejillaAulas>` pasa a `items-stretch`: las tarjetas de una fila igualan altura. El riel de 4px usa el token pleno (≥3:1, visible en `.hc`).                  |
| AC5 | Cumple    | `tarjeta-aula.spec.tsx` corre `axe` en los tres temas; el orden `<h1>`→`<h3>` intacto. `grep -rE "#[0-9a-fA-F]{3,6}" src --include=*.tsx` sin resultados en lo tocado.                                           |
| AC6 | Cumple    | `typecheck`, `lint` (0 errores), `build` y `npm run test` de `web` (46 archivos / 739 tests) + `types` en verde. `api` sin cambios.                                                                              |

## Notas de implementación

`describirHorario` se conserva (mismo string) para sus ~10 consumidores; solo la tarjeta pasa a
`describirHorarioPartes`. `<RejillaAulas>` cambia `items-start` → `items-stretch` (era lo que impedía
igualar alturas); afecta a todas sus rejillas, que es el objetivo. Microcopy de los nueve estados y
de «Modo sin indicar»: ya cumplía `voz-microcopy.md`, solo cambió la pluralización de cupos.
El mismo arreglo de fecha aplica a la tarjeta del `panel-estudiante` (HU-413).
Toque de pulido: la tarjeta gana estado `hover` (borde a `--input`, tinte `bg-muted/50`,
`shadow-md` breve y 2px de subida con `motion-safe`), que además cubría un hueco —toda la tarjeta
es un enlace y no daba señal al puntero—.
