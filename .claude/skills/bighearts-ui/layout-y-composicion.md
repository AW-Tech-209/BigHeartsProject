# Layout y Composición — BigHearts

## 1. Navigation & Shell

- **Posición:** SIEMPRE barra superior (58px, `bg-card border-b border-border`). NUNCA barra lateral.
- **Elementos:** Marca a la izq (`text-primary font-medium`), Avatar 30px a la der.
- **Destinos por rol (`text-sm`):**
  - `STUDENT`: Aulas · Mis clases · Perfil
  - `TEACHER`: Aulas · Mis aulas · Perfil
  - `ADMIN`: Aulas · Panel · Perfil
- **Estado activo:** Borde inferior de 2px en `border-primary` (no solo cambio de color).
- **Escritorio:** Todos los enlaces visibles. **PROHIBIDO menú hamburguesa.**
- **Móvil (< 640px):** Barra inferior fija con Ícono + Texto siempre visible (sin drawers/toggles).
- **Accesibilidad:** `<SkipLink>` al inicio del shell apuntando al `<main id="...">`.

## 2. Contenedor y Rejilla

- **Contenedor:** `mx-auto max-w-6xl px-4 sm:px-6` (Max 1152px).
- **Rejilla:** `grid gap-3` → 1 col (<640px) | 2 cols (≥640px) | 3 cols (≥1024px).
- **Límite:** MAX 3 columnas (NUNCA 4).

## 3. Anatomía de Página (Orden vertical estricto)

1. **Cabecera:** Único `<h1>` (`text-3xl font-medium tracking-tight sm:text-2xl`), línea de contexto (`text-base text-muted-foreground max-w-[46ch]`), acción principal a la derecha (opcional). Usar `usePageTitle`.
2. **Controles:** Filtros/búsqueda persistentes (NUNCA en desplegables), separados por `border-b border-border`.
3. **Contenido:** Rejilla, lista o formulario.

- **Ritmo Vertical:** 30px aire superior en cabecera; 32px (`space-y-8`) entre bloques principales; 16px dentro de bloques. Sin valores arbitrarios.

## 4. Tarjetas vs. Filas

- **Uso:** Tarjeta para explorar/elegir; Fila para administrar/listas largas (>15 items).
- **Anatomía Tarjeta:**
  - `<article className="rounded-xl border border-border bg-card p-4 pl-5 relative overflow-hidden" aria-labelledby="title-id">`
  - **Riel lateral:** `absolute inset-y-0 left-0 w-1` con color de estado (sin border-radius propio).
  - **Orden DOM estricto:**
    1. Fecha (`text-xs text-muted-foreground`) → Va ANTES en DOM para lectores de pantalla.
    2. Título `<h3>` (`text-base font-medium` id="title-id").
    3. Subtítulo/Profesor (`text-[13px] text-muted-foreground`).
    4. `<EstadoAula>`.
- **Anatomía Fila:** Mantiene el riel de 4px, elimina el `rounded-xl`.

## 5. Regla de Estados (Sólido vs. Suave)

- **Sólidos (Highlight alto):** ÚNICAMENTE `acceso-abierto` (ámbar) y `en-curso` (verde). Indican acción inmediata.
- **Suaves (Soft):** Los 7 estados restantes. NUNCA elevar otro estado a sólido.

## 6. Ilustraciones y Estados Vacíos

- **Ubicación:** SOLO en estados vacíos y onboarding. NUNCA en tarjetas o junto a datos.
- **Estilo:** Geométrica (construida con rectángulos de tarjeta/rieles). Solo tokens de color (cero degradados, sombras o hex hardcodeados). `role="img"` + `aria-label`. No añade info que no esté en texto.
- **Orden Estado Vacío:** Ilustración → Titular (`text-xl`) → Ayuda (`text-base text-muted-foreground max-w-[38ch]`) → Botón con verbo de acción.

## 7. Reglas Prohibidas (Strict Constraints)

- Barra lateral de navegación.
- Menú hamburguesa en escritorio.
- Más de 3 columnas en la rejilla.
- Filtros ocultos dentro de desplegables.
- Más de 1 acción primaria por pantalla.
- Estados sólidos distintos de `acceso-abierto` o `en-curso`.
- Más de un tag `<h1>` por página.
- Espaciados fuera del estándar (16px / 32px).
- Ilustraciones con información exclusiva no presente en texto.

## 8. Pantallas sin sesión (login, registro, recuperación) — HU-408

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
