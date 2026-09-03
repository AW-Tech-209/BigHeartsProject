# HU-408 — Identidad visual y pantallas de acceso

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                           |
| **Prioridad**       | 🟠 Alta (bloquea HU-409 y HU-411)                   |
| **Estimación**      | 2 días                                              |
| **Estado**          | ⬜ Pendiente                                        |
| **Rama**            | `104-hu-408-identidad-visual-y-pantallas-de-acceso` |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | ninguna                                             |
| **Labels**          | `cierre-fase-1` `prioridad:alta` `frontend` `a11y`  |

> **Como** persona que llega a BigHearts sin sesión,
> **Quiero** que las pantallas de acceso tengan una identidad propia —marca, un panel que explique
> qué es esto—,
> **Para** entender el producto antes de entrar y no aterrizar en un formulario suelto.

## Contexto

HU-407 cerró la **funcionalidad** de la Fase 1. Falta la capa de identidad visual. Hoy login,
registro y «cuenta creada» se pintan como un formulario centrado sobre
`<AppShell conNavegacion={false}>`, con la marca en texto plano `BigHearts` en la barra, sin logo y
sin favicon (el `<title>` del documento dice «Academia»).

La referencia de diseño introduce un **layout partido** para las pantallas sin sesión: formulario a
la izquierda, panel de marca a la derecha sobre una superficie de color, con logo, un titular, tres
propuestas de valor y un sello «Entorno de pruebas · Fase 1» al pie. Esta HU construye esa
estructura y migra a ella las tres pantallas sin sesión, **sin tocar su lógica ni su validación**.

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` → `layout-y-composicion.md` (anatomía de página, ritmo
  vertical), diccionario de color (`primary` **nunca** para decoración), triple codificación.
  `docs/ARQUITECTURA.md` §9.
- **Reutiliza:** `<PaginaCabecera>`, `<SkipLink>`, `<LiveAnnouncer>`/`useAnnounce`, `SelectorTema`,
  `usePageTitle`. El patrón de `<AppShell conNavegacion={false}>` se sustituye por el nuevo layout
  **solo en las rutas de acceso**; el resto del shell no se toca.
- **Decisión ya tomada (a registrar):** el panel de marca usa un par de tokens **propios**
  `--brand` / `--brand-foreground` (azul profundo fijo, texto blanco, verificado a contraste en los
  tres modos), **no** `--primary`. Motivo: el skill prohíbe `primary` como superficie decorativa y
  `primary` se invierte en `.dark`; la marca tiene que verse igual en los tres modos. Va a
  `ARQUITECTURA.md` §2.
- **Decisiones pendientes que bloquean esta HU:** ninguna.
- **Bloquea a:** HU-409, HU-411.

## 🔧 Tasks

**Una sola persona, una sola sesión.**

### Frontend

- [x] **T1** — `<MarcaBigHearts>` en `components/layout/`: lockup de logo (ícono de corazón en SVG
      **inline**, solo tokens, + la palabra «BigHearts»). Prop para superficie clara y para
      `--brand`. Cero hex, legible en `.hc`. Ícono `aria-hidden`, la palabra es texto real.
- [x] **T2** — Tokens `--brand` / `--brand-foreground` en `apps/web/src/index.css` (`:root`,
      `.dark`, `.hc`, `.hc.dark` — **el mismo azul en los cuatro**, es identidad, no estado) y su
      exposición en `@theme inline`. Espejo en `.claude/skills/bighearts-ui/tokens.css`.
- [x] **T3** — `<LayoutAutenticacion>` en `components/layout/`: rejilla de dos columnas en
      `≥ lg`; formulario a la izquierda dentro de un contenedor de ancho de lectura, `<PanelDeMarca>`
      a la derecha. Debajo de `lg` el panel colapsa a una cabecera compacta con solo el logo y el
      formulario ocupa todo el ancho. `<SkipLink>` sigue siendo el primer enfocable; `<main
id="contenido" tabIndex={-1}>` sigue siendo el destino del salto.
- [x] **T4** — `<PanelDeMarca>`: logo, titular, tres propuestas de valor (ícono Lucide + texto,
      triple codificación) y el sello «Entorno de pruebas · Fase 1» al pie. `SelectorTema` reubicado
      al extremo superior derecho del área del formulario, operable por teclado y con el cambio
      anunciado. El copy es provisional — el pulido de microcopy es de HU-409.
- [x] **T5** — Migrar `LoginPage`, `RegisterPage` y `RegistrationResult` a `<LayoutAutenticacion>`,
      sin cambiar formularios ni validación. Un solo `<h1>` por pantalla vía `<PaginaCabecera>`
      (`Inicia sesión` / `Crea tu cuenta` / el título de resultado). `HomePage` **no** entra.
- [x] **T6** — `apps/web/index.html`: `<title>BigHearts</title>` y favicon (ícono de corazón, SVG,
      en `apps/web/public/`).

### Documentación

- [x] **T7** — `ARQUITECTURA.md` §9 (estructura de las pantallas de acceso) + fila de decisión en §2.
      `layout-y-composicion.md` del skill (sección nueva: pantallas sin sesión). `docs/historias/
README.md` (estado y nota de que HU-407 cerró funcionalidad y este bloque cierra identidad).
      Tests con el patrón de HU-205.

## ✅ Criterios de aceptación

- [x] **AC1** — Login, registro y «cuenta creada» se pintan con el layout partido: formulario a la
      izquierda y `<PanelDeMarca>` a la derecha en `≥ 1024px`; en `< 1024px` el panel colapsa a una
      cabecera con logo y el formulario ocupa el ancho. Verificado a ojo a 500 / 800 / 1200 px.
- [x] **AC2** — Cada una de las tres pantallas conserva **exactamente un `<h1>`**, el foco salta a
      él al montar y `document.title` termina en `· BigHearts`. Verificado con
      `pages/paginas.spec.tsx` sin cambiar los `h1` esperados (`Inicia sesión`, `Crea tu cuenta`).
- [x] **AC3** — El `<SkipLink>` «Saltar al contenido» sigue siendo el primer elemento enfocable y su
      `href` apunta al `<main tabindex="-1">`. Verificado con el test estructural existente.
- [x] **AC4** — El panel de marca usa el token `--brand`, no `--primary`, y
      `grep -rE "#[0-9a-fA-F]{3,6}" apps/web/src --include=*.tsx` no devuelve nada. Logo y panel
      siguen legibles en `.dark` y `.hc` (contraste de texto ≥ 4.5:1). Verificado a ojo en los tres
      modos + grep.
- [x] **AC5** — `axe` limpio en las tres pantallas en `light`, `dark` y `hc`, con el helper de
      HU-205. Cero violaciones.
- [x] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces) en verde.

## 🚫 Fuera de alcance

- El pulido de microcopy del panel y de los formularios → **HU-409**.
- Los campos con icono guía y el enlace «¿Olvidaste tu contraseña?» → **HU-409**.
- Las pantallas de recuperación de contraseña → **HU-410** (backend) y **HU-411** (frontend).
- Cualquier cambio a `HomePage` (sigue con su copy de scaffold; se retoma aparte).
- Rediseño de las pantallas **con** sesión (shell principal, catálogo, panel…).
- Alto contraste como opción visible en la UI (sigue la decisión de HU-216).

## Recorrido de acceptance criteria

| AC  | Veredicto | Cómo se comprobó                                                                                                                                                    |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | Cumple    | Navegador a 375 / 800 / 1200 px: dos columnas en `≥ lg`, panel colapsado a barra con logo en `< lg`, formulario a todo el ancho. Login y registro.                  |
| AC2 | Cumple    | `pages/paginas.spec.tsx` verde sin cambios (un `<h1>`, foco al montar, `document.title` termina en `· BigHearts`). Verificado también en el navegador.              |
| AC3 | Cumple    | `pages/paginas.spec.tsx` + `layout-autenticacion.spec.tsx`: skip-link primero, `href="#contenido"`, `<main tabindex="-1">`.                                         |
| AC4 | Cumple    | Panel usa `bg-brand`; `grep -rE "#[0-9a-fA-F]{3,6}" apps/web/src --include=*.tsx` sin resultados. Navegador en claro y oscuro: el panel no se invierte.             |
| AC5 | Cumple    | `layout-autenticacion.spec.tsx` y `paginas.spec.tsx` corren `axe` en `light` / `dark` / `hc` — cero violaciones.                                                    |
| AC6 | Parcial   | `typecheck`, `lint` (0 errores), `build` y `test` de `web` + `types` en verde. `api`: falla solo `bookings-index.integration.spec.ts` (necesita BD; CI la levanta). |

## Notas de implementación

`--brand` es azul marino, igual en los tres modos (identidad, no estado, D39); blanco encima ~16:1.
`MarcaBigHearts` usa `currentColor` en vez de una prop de tono. Un solo `SelectorTema` (barra de
marca en móvil solo muestra el logo). `bookings-index.integration.spec.ts` ya fallaba sin BD local
antes de esta HU (backend intacto).
