# Layout y Composición — BigHearts

## 1. Navigation & Shell

- **Posición:** SIEMPRE barra superior (58px). NUNCA barra lateral. Superficie **`bg-brand`** (azul
  marino, HU-415) con marca, navegación, cuenta y `SelectorTema` en `brand-foreground`; la barra
  inferior de móvil, igual. Es la superficie de identidad, la misma en los tres modos.
- **Elementos:** Lockup marca (glifo `<MarcaBigHearts>` + palabra, `text-brand-foreground`) a la
  izq, Avatar 30px + cuenta + `Cerrar sesión` a la der.
- **Destinos por rol (`text-sm`):**
  - `STUDENT`: Aulas · Mis clases · Historial · Perfil
  - `TEACHER`: Aulas · Mis aulas · Historial · Perfil
  - `ADMIN`: Aulas · Panel · Perfil
- **Estado activo:** Borde de 2px en `border-brand-foreground` (blanco sobre la barra), no solo
  cambio de color.
- **Escritorio (≥ `lg`):** Todos los enlaces visibles. **PROHIBIDO menú hamburguesa.**
- **Móvil / tablet (< `lg`, 1024px):** Barra inferior fija con Ícono + Texto siempre visible (sin
  drawers/toggles). El corte es `lg` y no `sm` (HU-415): entre 640 y 1024 la barra superior no cabe
  sin apretarse. Lo decide `useEsMovil`.
- **Accesibilidad:** `<SkipLink>` al inicio del shell apuntando al `<main id="...">`.

## 2. Contenedor, Lista y Rejilla

- **Contenedor:** `mx-auto max-w-6xl px-4 sm:px-6` (Max 1152px).
- **Lista de aulas (`<ListaAulas>`, HU-414):** las pantallas de aulas —catálogo, «Mis
  clases», «Mis aulas», panel del profesor— apilan un **renglón por aula** en una sola
  columna a todo el ancho (`flex flex-col gap-2.5`). No usan rejilla: un renglón de alto
  modular con zonas de ancho fijo se escanea mejor que una tarjeta que cambia de alto según
  cuántas etiquetas tenga cada clase. La anatomía del renglón está en §4.
- **Rejilla (`<RejillaAulas>`):** `grid gap-3` → 1 col (<640px) | 2 cols (≥640px) | 3 cols
  (≥1024px). Queda para **tableros** donde el aula se pinta compacta (las próximas clases
  del panel del estudiante).
- **Límite de la rejilla:** MAX 3 columnas (NUNCA 4).

## 3. Anatomía de Página (Orden vertical estricto)

1. **Cabecera:** Único `<h1>` en **`font-serif font-normal`** (`text-3xl … sm:text-4xl`, HU-415),
   línea de contexto (`text-base text-muted-foreground max-w-[46ch]`), acción principal a la
   derecha (opcional). Usar `usePageTitle`. Filigrana de marca decorativa opcional (`aria-hidden`,
   `<MarcaBigHearts>` al 7 % en neutro).
2. **Controles:** Filtros/búsqueda persistentes (NUNCA en desplegables). Van en un panel contenido
   (`rounded-xl border bg-card`), no una línea suelta.
3. **Contenido:** Rejilla, lista o formulario. Una rejilla/lista de resultados puede entrar con
   `subir-suave` (`index.css`) — una sola vez, respeta `prefers-reduced-motion`.

- **Ritmo Vertical:** 30px aire superior en cabecera; 32px (`space-y-8`) entre bloques principales; 16px dentro de bloques. Sin valores arbitrarios.

## 4. Renglón de aula, Tarjeta y Fila

- **Uso:** Renglón de aula (`<TarjetaAula>`) para explorar/elegir una clase; Tarjeta de
  resumen para el panel; Fila para administrar/listas largas (>15 items).
- **Anatomía del renglón de aula (`<TarjetaAula>`, HU-414):** una fila horizontal a todo el
  ancho, de alto modular. `<article aria-labelledby="title-id">` sobre
  `flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 shadow-xs`
  - `focus-within:ring-2 focus-within:ring-ring` (el anillo va en el renglón, aunque el foco
    lo reciba el enlace del título).
  * **Riel lateral:** `absolute inset-y-0 left-0 w-1` con color de estado (sin border-radius
    propio), en las dos perspectivas.
  * **Cuatro zonas** (`flex flex-wrap items-start gap-4`; bajo ~720px se apilan solas):
    1. **Cuándo** `w-29 border-r`: día abreviado (`describirHorarioRenglon`), hora
       `tabular-nums`, zona horaria en su propia línea (`text-xs whitespace-nowrap`).
    2. **Qué** `min-w-0 flex-1`: `<h3>` con el `<Link>` al detalle (único enlace, con el
       `after:absolute after:inset-0` de overlay), subtítulo, y **una sola fila** de badges:
       `<EstadoAula>` + `Tu clase` + `Coincide con tu preferencia` (siempre visibles, no
       cuentan) seguidos de los modos de comunicación y apoyos hasta `maxEtiquetasVisibles`
       (default 3); el resto colapsa tras un `<button aria-expanded aria-controls>` `+N`.
    3. **Cupo** `w-44`: `<IndicadorCupo variante="inscritos">` solo en la perspectiva del
       profesor; en el catálogo el badge de estado ya dice el cupo y la zona va vacía.
    4. **Qué hago** `w-49`: una acción primaria (reservar / entrar / cancelar / gestionar).
  * **Orden DOM estricto:** cuándo → `<h3>` → subtítulo → fila de badges → cupo → acción →
    banda «También:» → banda de aviso.
  * **Banda «También:»** (`border-t`, `+N` abierto): las etiquetas colapsadas, precedidas de
    `<span>También:</span>`.
  * **Banda de aviso** (`border-t`): **solo reubica** mensajes que la acción ya pintaba
    —cuenta atrás de acceso, «ya no se puede cancelar», error de reserva—. No entra ningún
    aviso nuevo.
- **Anatomía Fila:** Chip de ícono a la izq + título (`<Link>` al detalle) + subtítulo + resultado
  o cifras a la derecha; `border-b` entre filas, sin `rounded-xl`. El chip puede tomar el tono
  suave de su resultado (mismo tono que el badge de al lado — refuerzo, no señal nueva).
  El historial (`<FilaHistorial>`, HU-415) es el ejemplo vivo — dejó de ser `<table>`.

## 5. Regla de Estados (Sólido vs. Suave)

- **Sólidos (Highlight alto):** ÚNICAMENTE `acceso-abierto` (ámbar) y `en-curso` (verde). Indican acción inmediata.
- **Suaves (Soft):** Los 7 estados restantes. NUNCA elevar otro estado a sólido.

## 6. Ilustraciones y Estados Vacíos

- **Ubicación:** SOLO en estados vacíos y onboarding. NUNCA en tarjetas o junto a datos.
- **Estilo:** Geométrica (construida con rectángulos de tarjeta/rieles). Solo tokens de color (cero degradados, sombras o hex hardcodeados). `role="img"` + `aria-label`. No añade info que no esté en texto.
- **Orden Estado Vacío:** Ilustración → Titular (`font-serif text-2xl`) → Ayuda (`text-base text-muted-foreground max-w-[38ch]`) → Botón con verbo de acción. El bloque se apoya en un panel de borde discontinuo (`border-dashed bg-muted/30`), no flota en el vacío (HU-415).

## 7. Reglas Prohibidas (Strict Constraints)

- Barra lateral de navegación.
- Menú hamburguesa en escritorio.
- Más de 3 columnas en la rejilla (no aplica a `<ListaAulas>`: es una sola columna).
- Filtros ocultos dentro de desplegables.
- Más de 1 acción primaria por pantalla.
- Estados sólidos distintos de `acceso-abierto` o `en-curso`.
- Más de un tag `<h1>` por página.
- Espaciados fuera del estándar (16px / 32px).
- Ilustraciones con información exclusiva no presente en texto.

## 8. Pantallas sin sesión (login, registro, recuperación) — HU-408 / HU-409

- **No usan `<AppShell>`.** No hay rol, así que no hay navegación que ofrecer. Usan
  `<LayoutAutenticacion>` (`components/layout/`).
- **Dos columnas en `≥ lg`:** formulario a la izquierda; `<PanelDeMarca>` a la derecha sobre la
  superficie **`--brand`** (marca + un titular + tres propuestas de valor + sello «Entorno de
  pruebas · Fase 1»). Debajo de `lg` el panel se reduce a una barra superior con solo la marca.
- **`--brand` / `--brand-foreground`** es un par de tokens de **identidad**: azul marino con
  texto blanco, **el mismo en los tres modos** (no se invierte como `--primary`). Único uso: este
  panel. No es color de estado ni de acción.
- **El logotipo** es `<MarcaBigHearts>` de `components/dominio/` (solo el trazo, `currentColor`),
  compartido con la landing. El lockup marca + palabra «BigHearts» se compone **en línea**, en
  `text-lg font-medium` — igual que en `cabecera-landing.tsx`, para no divergir de la app.
- Conserva el contrato del shell: `<SkipLink>` primero, `<main id="contenido" tabIndex={-1}>` como
  destino, y el único `<h1>` lo pone `<PaginaCabecera>`. El `SelectorTema` va arriba a la derecha
  del área del formulario.
- **Campos (HU-409):** email y contraseña llevan un **ícono guía** a la izquierda del control
  (`<Input iconoInicio={...}>`, `aria-hidden`, no sustituye a la etiqueta). En login, «¿Olvidaste tu
  contraseña?» va como enlace a la derecha de la etiqueta «Contraseña» (`<Field labelAside={...}>`).
- **Recuperación (HU-411):** `/recuperar-contrasena` lleva un enlace «Volver a iniciar sesión»
  arriba de la cabecera; su éxito es un `<Callout success>` que **no revela** si el email existe.
  `/nueva-contrasena` lee `?token=`; sin token, un `<Callout destructive>` enlaza a pedir otro.
