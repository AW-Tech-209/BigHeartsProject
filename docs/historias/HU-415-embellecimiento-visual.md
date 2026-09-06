# HU-415 — Embellecimiento visual (cierre de Fase 1)

| Campo               | Valor                                              |
| ------------------- | -------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                          |
| **Prioridad**       | 🟠 Alta                                            |
| **Estimación**      | 3 días                                             |
| **Estado**          | 🔄 En curso                                        |
| **Rama**            | `hu-415-embellecimiento-visual`                    |
| **Alcance técnico** | frontend                                           |
| **Depende de**      | HU-414 (`<TarjetaAula>` ya en `main`)              |
| **Labels**          | `cierre-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** quien va a enseñar BigHearts a un cliente, un profesor o alguien de fuera,
> **Quiero** que todas las vistas se lean como un producto terminado y del mismo sistema,
> **Para** que no parezca un prototipo — sin perder ni una función ni un punto de accesibilidad.

## Contexto

HU-408–411 rehicieron las pantallas sin sesión y HU-414 la tarjeta compartida. Esta HU pasa por
**todas las vistas con sesión** subiendo el nivel visual sin reconstruir nada: superficie,
elevación, tipografía, ritmo, micro-interacciones, responsive real y estados. Dos decisiones de
identidad, a pedido, amplían límites que hasta ahora fijaban los skills — y por eso se documentan
aquí y en `bighearts-ui`:

- La **barra superior** (y la inferior de móvil) pasan a la superficie **`--brand`** (azul marino).
  `--brand` deja de ser exclusivo del panel de acceso: es la identidad de toda la app con sesión.
- El **`<h1>` de cada página** pasa a `font-serif` (Instrument Serif), en armonía con los titulares
  de cierre y las citas de la landing. El resto del producto sigue en Geist.

El único límite que **no** se movió: el diccionario de color. Nada decorativo reusa
verde/ámbar/rojo, porque en este producto esos significan éxito/tiempo/error y el usuario los lee.

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` → `SKILL.md` (color, tipografía, elevación),
  `layout-y-composicion.md` (shell, anatomía de página, patrón «Fila»), `voz-microcopy.md`
  (formato de fecha).
- **Reutiliza / toca:** `components/ui/` (`card`, `button`, `field`, `native-select`, `table`,
  `alert-dialog`, nuevo `switch`), `components/layout/` (`app-shell`, `pagina-cabecera`,
  `selector-tema`), `components/dominio/` (`estado-vacio`), `features/panel/`, `features/historial/`
  (nuevo `fila-historial`), `features/aulas/` (`filtros-aulas`, `lib/horario`), `hooks/use-es-movil`,
  `index.css`.
- **Decisiones pendientes que bloquean esta HU:** ninguna.

## 🔧 Tasks

### Frontend

- [x] **T1** — **Sistema + shell.** `<Card>` y botón sólido con `shadow-xs` de reposo; lockup marca + glifo y `backdrop`; **barra superior e inferior en `bg-brand`** con marca/nav/cuenta/tema en
      `brand-foreground`; `<EstadoVacio>` sobre panel de borde discontinuo. `useEsMovil` pasa a
      `(max-width: 1023px)`: la barra inferior gobierna hasta `lg`.
- [x] **T2** — **Tipografía.** `<h1>` de `<PaginaCabecera>`, titular de `<EstadoVacio>` y
      `<AlertDialogTitle>` a `font-serif`, `font-normal`. Cuerpo, labels y `<h2>` en Geist.
- [x] **T3** — **Catálogo `/aulas`.** Filtros en panel contenido; filigrana de marca en la
      cabecera; rejilla con entrada `subir-suave`; «Solo mis clases» → `<Switch>` (nuevo primitivo
      Base UI); «Quitar filtros» visible en la barra en cuanto hay un filtro; etiqueta de color por
      campo con tokens `--accent-indigo/teal/rose` (categórico decorativo, **nunca** estado).
- [x] **T4** — **Panel de inicio.** Tarjeta del estudiante con riel de 4px (le faltaba), cabecera
      agrupada, fecha sin huérfanas, `hover`; chips de ícono en las cabeceras de sección.
- [x] **T5** — **Listas + historial.** Banda `bg-muted/40` en `<TableHeader>`; el historial deja de
      ser `<table>` y adopta el patrón «Fila» (`<FilaHistorial>` compartida): título enlazado a
      `/aulas/:id`, fecha compacta (`describirFechaCompacta`), y el chip toma el tono del resultado.
      Las cinco paginaciones alineadas por borde superior.
- [x] **T6** — **Detalle de aula.** `shadow-xs` en todas las secciones; fecha del resumen lateral
      sin huérfanas; micro-entrada (`scale`) del diálogo de confirmación.

### Documentación

- [x] **T7** — `HU-415-*.md` + `README.md`; `bighearts-ui` → `SKILL.md` (`--brand` extendido,
      serif en `<h1>`, tokens `--accent-*`), `layout-y-composicion.md` (shell navy, `<h1>` serif,
      corte a `lg`, `subir-suave`), `voz-microcopy.md` (fecha compacta para tablas/listas).

## ✅ Criterios de aceptación

- [x] **AC1** — Toda pantalla con sesión tiene la barra superior (y la inferior en móvil) sobre
      `--brand`, con marca, navegación, cuenta y tema en `brand-foreground`; el destino activo
      conserva el borde de 2px, ahora en blanco. Verificado en `app-shell.spec.tsx` (3 temas) y a
      ojo en claro y oscuro.
- [x] **AC2** — El `<h1>` de cada página se pinta en `font-serif`; cuerpo, labels y `<h2>` siguen
      en Geist. Sin `uppercase` en frases.
- [x] **AC3** — Ninguna de las etiquetas de color del filtro usa verde/ámbar/rojo. Los tres tokens
      `--accent-*` están verificados a mano ≥6.5:1 (la mayoría AAA) contra `--background` y `--card`
      en claro y oscuro — el `color-contrast` de axe no corre en jsdom.
- [x] **AC4** — El historial se lee como lista de filas: cada fila enlaza a `/aulas/:id`, muestra
      la fecha compacta y el resultado en color + ícono + texto (badge) más el tono del chip. `axe`
      limpio en los 3 temas (`HistorialPage.spec.tsx`).
- [x] **AC5** — «Solo mis clases» es un interruptor con nombre accesible «Solo mis clases»
      (`getByRole('switch', {name})`); enciende/apaga el filtro con `undefined`, no con `false`.
      `axe` limpio (`filtros-aulas.spec.tsx`).
- [x] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` de `web`
      en verde. `api` y `types` sin cambios.

## 🚫 Fuera de alcance

- Cambios de lógica, rutas, contrato (`packages/types`) o backend.
- Recolorear el ícono nativo del `<input type="date">` — lo dibuja el navegador y no se puede de
  forma fiable en todos.
- La composición fina del catálogo y del panel más allá de lo tocado → sigue en **HU-412** /
  **HU-413** si queda algo.

## Recorrido de acceptance criteria

| AC  | Veredicto | Cómo se comprobó                                                                                                                                                                  |
| --- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | Cumple    | `app-shell.spec.tsx` (19 tests, 3 temas): activo con `border-b-2` + `border-brand-foreground`, sin estado oculto. A ojo en claro/oscuro y a 375 / 800 / 1280 px.                  |
| AC2 | Cumple    | `<PaginaCabecera>` h1 = `font-serif text-3xl font-normal … sm:text-4xl`; `<EstadoVacio>` y `<AlertDialogTitle>` igual. El resto de textos sin cambio de familia.                  |
| AC3 | Cumple    | `--accent-indigo/teal/rose` en `index.css` (claro + oscuro), expuestos a Tailwind. Script de contraste OKLCH→sRGB→WCAG: 7.0–7.9 en claro, 6.5–8.5 en oscuro. Sin green/amber/red. |
| AC4 | Cumple    | `<FilaHistorial>` (`<ul>`/`<li>`, sin `<table>`), título `<Link>`, `describirFechaCompacta` con su `*.spec.ts`. `HistorialPage.spec.tsx` (7 tests) + `axe` en 3 temas.            |
| AC5 | Cumple    | `<Switch>`/`<SwitchField>` sobre Base UI; `filtros-aulas.spec.tsx` (21 tests) y `AulasPage.spec.tsx` (41) por `getByRole('switch', {name})`. Apaga con `undefined`.               |
| AC6 | Cumple    | `typecheck` y `lint` (0 errores) en verde; specs por bloque en verde (machine con carga: la suite completa se corre por lotes). `api`/`types` sin tocar.                          |

## Notas de implementación

- `--brand` deja de ser exclusivo del panel de acceso — ahora es la identidad de la app con
  sesión (skill `bighearts-ui` actualizado).
- El serif sale de la landing hacia los `<h1>` de la app (skill actualizado).
- Tres tokens decorativos nuevos (`--accent-indigo/teal/rose`), categóricos, nunca estado.
- `useEsMovil` → `(max-width: 1023px)`: la barra inferior gobierna hasta `lg`; entre 640 y 1024 la
  superior se solapaba con marca + destinos + cuenta.
- El historial adopta el patrón «Fila» que `layout-y-composicion.md` §4 ya prescribía para listas
  largas — la versión `<table>` de HU-404 fue una lectura; esta es la del skill.
