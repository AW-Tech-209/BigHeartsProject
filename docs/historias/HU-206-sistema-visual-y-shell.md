# HU-206 — Sistema visual y shell de la aplicación

| Campo            | Valor                                            |
| ---------------- | ------------------------------------------------ |
| **Sprint**       | Sprint 2 — Gestión de Aulas                      |
| **Prioridad**    | 🔴 Crítica (bloquea HU-201)                      |
| **Estimación**   | 3 días                                           |
| **Estado**       | ⬜ Pendiente                                     |
| **Rama**         | `hu-206-sistema-visual-y-shell-<persona>`        |
| **Colaboración** | Solo Dev B                                       |
| **Depende de**   | HU-205 (✅ completada)                           |
| **Labels**       | `sprint-2` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante, profesor o administrador,
> **Quiero** moverme por una plataforma con una estructura visual coherente y una navegación
> siempre visible,
> **Para** entender dónde estoy y a dónde puedo ir sin tener que aprenderme la interfaz.

## Contexto

Hoy hay seis páginas —`HomePage`, `LoginPage`, `RegisterPage`, `PanelPage`, `PerfilPage`,
`NotFoundPage`— y **ninguna comparte estructura**. No hay shell, no hay navegación, no hay
cabecera de página común. Cada pantalla se maqueta desde cero, y por eso el resultado cumple las
reglas del skill pero no se parece a un producto.

El diagnóstico: `bighearts-ui` era un **sistema de restricciones**, no un lenguaje visual. Decía
qué está prohibido y qué exige la accesibilidad; no decía cómo se ve una página. Esa capa acaba de
escribirse en **`layout-y-composicion.md`**, y esta HU la implementa.

**Va antes de HU-201.** Las cuatro pantallas del Sprint 2 tienen que nacer dentro del sistema; si
se hacen primero y se retocan después, se paga dos veces.

## Dependencias técnicas

- **Skill:** `bighearts-ui` → **lee `layout-y-composicion.md` entero**. Es la especificación de esta
  HU, y la mayoría de los AC se verifican contra él.
- **Reutiliza:** `<SkipLink>`, `<LiveAnnouncer>`, `usePageTitle`, `useAnnounce` — ya existen, no los
  reimplementes.
- **HU-205 ya dejó montado** Vitest + Testing Library + `axe` en `apps/web`, con
  `renderConProviders()` y el helper de accesibilidad. Todo lo nuevo de esta HU nace con tests.
- **Bloquea a:** HU-201, HU-203, HU-204 (todas montan pantalla sobre el shell).

### Decisiones tomadas (2026-08-18)

Salen de la sesión de exploración visual; el detalle y el porqué están en
`layout-y-composicion.md`.

1. **Navegación superior, nunca lateral.** Hay 3–4 destinos por rol; una lateral es espacio muerto
   y la rejilla de aulas agradece el ancho.
2. **Nada de hamburguesa en escritorio.** En móvil, **barra inferior fija con ícono + texto** — no
   cajón. Un cajón añade un estado que aprender, y este producto minimiza estados ocultos.
3. **La paleta no se toca.** La calidez viene del espacio, el peso tipográfico y el radio. Los
   contrastes ya están verificados en tres modos.
4. **Rejilla de 1/2/3 columnas.** Nunca cuatro: el título de aula parte en tres líneas.
5. **Solo `acceso-abierto` y `en-curso` van en color sólido.** El resto, suaves.
6. **Ilustración geométrica solo en vacíos y onboarding**, construida con tarjeta + riel, solo
   tokens.

## 🔧 Tasks — Dev B

- [ ] **T1** — `<AppShell>` en `components/layout/`: barra superior de 58px con marca, destinos
      **según rol** y avatar; `<SkipLink>` antes de la barra; `<main>` con `id` de destino. El
      enlace activo lleva borde inferior de 2px, no solo color.
- [ ] **T2** — Barra inferior fija en móvil (< 640px) con ícono **+ texto**. Los mismos destinos
      que arriba, sin toggle ni cajón.
- [ ] **T3** — `<PaginaCabecera>`: `<h1>` en `text-3xl` (`text-2xl` en móvil), línea de contexto en
      `text-base` con `max-w-[46ch]`, y ranura para la acción principal. Un solo `<h1>` por página.
- [ ] **T4** — `<Contenedor>` (`mx-auto max-w-6xl px-6 / px-4`) y `<RejillaAulas>` con el patrón
      1/2/3 columnas y `gap-3`.
- [ ] **T5** — Primitivas que faltan en `components/ui/`, sobre Base UI y con la prop `render`:
      **`AlertDialog`** (HU-104 y HU-202), **`Table`** (HU-104), **`Badge`**, **`Skeleton`** y
      **`Separator`**.
- [ ] **T6** — `<EstadoVacio>` en `components/dominio/`: ilustración + titular + línea de ayuda +
      botón con verbo. Crea la carpeta `components/dominio/`.
- [ ] **T7** — Tres ilustraciones geométricas reutilizables —vacío, no encontrado, error— con
      `role="img"` y `aria-label`, solo tokens.
- [ ] **T8** — Migrar las **seis páginas existentes** al shell y a `<PaginaCabecera>`, sin cambiar
      su funcionalidad. `LoginPage` y `RegisterPage` usan el shell **sin navegación** (no hay
      sesión): solo marca y contenedor.
- [ ] **T9** — Tests con el patrón de HU-205: navegación por rol, `axe` limpio en las seis páginas,
      y render en `light`, `dark` y `hc`.
- [ ] **T10** — Actualizar `CLAUDE.md` (la estructura de `apps/web/src/` ahora incluye `layout/` y
      `dominio/`) y `ARQUITECTURA.md` §9.

## ✅ Criterios de aceptación

- [ ] **AC1** — **Navegación por rol:** un `STUDENT` ve Aulas · Mis clases · Perfil; un `TEACHER`
      ve Mis aulas en lugar de Mis clases; un `ADMIN` ve Panel. Verificado con un test por rol que
      consulta por `getByRole('link')`.
- [ ] **AC2** — **Sin estado oculto:** en escritorio los destinos se ven todos sin pulsar nada — no
      existe ningún botón que despliegue la navegación. En móvil la barra inferior está siempre
      visible y no tiene toggle.
- [ ] **AC3** — El destino activo se distingue **por borde inferior de 2px además del color**, y se
      sigue distinguiendo en `.hc`.
- [ ] **AC4** — **Las seis páginas** usan `<AppShell>` y `<PaginaCabecera>`, con exactamente un
      `<h1>`, y el foco salta a él al cambiar de ruta.
- [ ] **AC5** — El skip-link es el primer elemento enfocable, y al activarlo el foco entra en
      `<main>`.
- [ ] **AC6** — **`axe` limpio en las seis páginas**, con el helper de HU-205. Cero violaciones.
- [ ] **AC7** — Las seis páginas se ven correctas en `light`, `dark` y `hc`, demostrado con tests
      que montan en los tres modos.
- [ ] **AC8** — **Rejilla:** a 500px se ve 1 columna, a 800px dos, a 1200px tres. Ningún ancho
      produce cuatro.
- [ ] **AC9** — **Regla del sólido:** `<EstadoAula>` pinta en color pleno **únicamente**
      `acceso-abierto` y `en-curso`; los otros siete usan la variante suave. Verificado con un test
      que recorre los nueve estados.
- [ ] **AC10** — **Ilustración:** las tres llevan `role="img"` con `aria-label`, no usan ni un color
      literal, y siguen legibles en `.hc`. Ninguna aporta información que no esté en el texto.
- [ ] **AC11** — **Cero colores literales** en todo lo entregado. Verificable con
      `grep -rE "#[0-9a-fA-F]{3,6}" apps/web/src --include=*.tsx` sin resultados.
- [ ] **AC12** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` (los tres workspaces) en verde.

## 🚫 Fuera de alcance

- **Los componentes de dominio del aula** —`<TarjetaAula>`, `<EstadoAula>`, `<IndicadorCupo>`—
  nacen en **HU-203** con sus tests. Aquí solo se crea la carpeta `components/dominio/` y el
  `<EstadoVacio>`, más la regla del sólido documentada para que HU-203 la obedezca.
- **Cualquier cambio de paleta.** Decisión 3.
- **Imágenes en tarjetas de aula** o portada por aula: exigiría subida de archivos, fuera del
  alcance de Fase 1.
- **Tema oscuro nuevo:** `.dark` y `.hc` ya existen en `index.css`; aquí solo se comprueban.
- Animaciones más allá de las ya listadas en el skill.
- Rediseño del contenido de las páginas: se migran a la estructura, no se reescriben.

## Notas de implementación

_Se rellena al cerrar._
