# HU-412 — Rediseño del catálogo de aulas y su barra de filtros

| Campo               | Valor                                              |
| ------------------- | -------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                          |
| **Prioridad**       | 🟠 Alta                                            |
| **Estimación**      | 2 días                                             |
| **Estado**          | ⬜ Pendiente                                       |
| **Rama**            | `<nº-issue>-hu-412-rediseno-del-catalogo-de-aulas` |
| **Alcance técnico** | frontend                                           |
| **Depende de**      | HU-408 (identidad ya en `main`)                    |
| **Labels**          | `cierre-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** persona que explora las clases de la academia,
> **Quiero** un catálogo con una barra de filtros clara y una rejilla ordenada,
> **Para** encontrar mi clase sin que la pantalla me estorbe.

## Contexto

Segundo lote del cierre visual (el primero fue login/registro/recuperación, HU-408–411). El
mockup de referencia mejora `/aulas` (`AulasPage`) respecto a lo que hay hoy:

- La **barra de filtros** pasa de una fila suelta con `border-b` a un **bloque contenido**
  (`rounded-xl border border-border bg-card p-4`) con una rejilla clara para Nivel / Modo de
  comunicación / Desde / Hasta y una fila secundaria con el toggle «Solo mis clases» y un botón
  **«Quitar filtros»** siempre visible (hoy solo aparece en los estados vacíos).
- La **rejilla** de tarjetas gana ritmo: alturas coherentes, separación del skill, sin que una
  tarjeta con más chips descuadre la fila.

`<TarjetaAula>` en sí (estados, cupos, fechas, microcopy) es **HU-414** — aquí solo se maqueta el
contenedor y los filtros.

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` → `layout-y-composicion.md` (contenedor y rejilla
  1/2/3 columnas, ritmo vertical 16/32, filtros persistentes nunca en desplegables), `voz-microcopy.md`.
- **Reutiliza:** `<AppShell>`, `<PaginaCabecera>`, `<RejillaAulas>`, `<FiltrosAulas>`, `<Field>`,
  `<NativeSelect>`, `<Input type="date">`, `<CheckboxField>`, `<EstadoVacio>`, `filtros-url` (los
  filtros y la página siguen viviendo en la URL, AC4 de HU-203 — no se toca).
- **Decisiones pendientes que bloquean esta HU:** ninguna.
- **Relación con:** HU-414 (la tarjeta), HU-413 (el panel).

## 🔧 Tasks

### Frontend

- [ ] **T1** — `<FiltrosAulas>`: envolver en un bloque `rounded-xl border border-border bg-card`
      con la rejilla de controles (Nivel / Modo / Desde / Hasta) alineada, y una fila secundaria
      separada por `border-t border-border` con «Solo mis clases» (cuando aplica) y el botón
      **«Quitar filtros»** (`variant="outline"`), deshabilitado cuando no hay filtros activos.
- [ ] **T2** — `AulasPage`: ajustar el ritmo vertical entre cabecera, filtros y rejilla al estándar
      del skill (`space-y-8`), y revisar los tres estados vacíos y el de error para que encajen en
      la nueva composición sin copy nuevo.
- [ ] **T3** — `<RejillaAulas>` / la rejilla: alturas coherentes entre tarjetas de la misma fila
      (que los chips que envuelven no descuadren), manteniendo el patrón 1/2/3 columnas.
- [ ] **T4** — Revisar la paginación y la `InvitacionPreferencia` en la nueva composición (sin
      cambiar su lógica).

### Documentación

- [ ] **T5** — `bighearts-ui` → `layout-y-composicion.md`: fijar la anatomía de la barra de filtros
      contenida si pasa a ser patrón. Tests con el patrón de HU-205.

## ✅ Criterios de aceptación

- [ ] **AC1** — La barra de filtros se pinta como un bloque contenido (`rounded-xl border bg-card`),
      con los cuatro controles en una rejilla y una fila secundaria con «Quitar filtros» siempre
      visible (deshabilitado si no hay filtros activos). Verificado a ojo y con `AulasPage.spec.tsx`.
- [ ] **AC2** — «Quitar filtros» limpia todos los filtros y la página de la URL en un clic;
      alcanzable con teclado y con foco visible. Verificado con `user-event`.
- [ ] **AC3** — Los filtros y la paginación **siguen en la URL**: abrir el mismo enlace en otra
      pestaña reproduce la vista. Los tests de `filtros-url` siguen en verde sin cambios.
- [ ] **AC4** — En una fila de la rejilla, dos tarjetas con distinto número de chips tienen la
      misma altura. A 500 / 800 / 1200 px se ven 1 / 2 / 3 columnas.
- [ ] **AC5** — `axe` limpio en `light`, `dark` y `hc` sobre la pantalla con datos, con filtros y
      vacía. Cero colores literales en `.tsx`.
- [ ] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces) en verde.

## 🚫 Fuera de alcance

- `<TarjetaAula>` (estados, cupos, fechas, chips de modo) → **HU-414**.
- El panel de inicio por rol → **HU-413**.
- Cambios en la API, en el contrato de `ListClassroomsQuery` o en `filtros-url`.
- Copy nuevo de estados vacíos o de error (se conservan los de HU-203/HU-208).

## Notas de implementación

Sin desviaciones previstas.
