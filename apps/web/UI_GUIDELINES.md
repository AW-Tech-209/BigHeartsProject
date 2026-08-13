# BigHearts — Convenciones de UI/UX

> **Para Claude Code:** este archivo es la fuente de verdad del diseño. Léelo **antes** de generar
> cualquier componente, pantalla o estilo. Si algo que te piden contradice este documento,
> dilo antes de escribir el código.
>
> Añade esta línea a tu `CLAUDE.md`:
>
> ```md
> @UI_GUIDELINES.md
> ```

---

## 0. Contexto en una frase

BigHearts es una academia de inglés en línea **para personas hipoacúsicas y sordomudas**.
La videollamada ocurre fuera (Zoom/Meet); la plataforma gestiona **acceso, cupos, reservas,
recordatorios e historial**.

Esto cambia todo el diseño:

> **En una interfaz para usuarios oyentes, el color decora. Aquí el color es un idioma.**
> El usuario no recibe ninguna información por sonido. Todo lo que un producto normal
> delegaría a un "ding", un timbre o un audio, aquí lo tiene que decir la pantalla.

**Regla fundacional #1 — Nada de color decorativo.** Si un elemento no es neutro (gris/blanco/tinta),
es porque _significa algo_. Un botón azul significa "acción principal". Una franja ámbar significa
"esto depende del tiempo". Un borde verde significa "hay cupo". No hay gradientes de adorno,
no hay acentos "porque se ve bonito". Cada color tiene una entrada en el diccionario de la §4.

**Regla fundacional #2 — Codificación triple.** Ningún estado se comunica solo con color.
Siempre **color + ícono + texto**. Sin excepciones. Esto cubre daltonismo, modo alto contraste,
impresión y capturas de pantalla en blanco y negro.

**Regla fundacional #3 — Cero dependencia del audio.** Nunca `new Audio()`, nunca `<audio>` como
señal, nunca "escucha el pitido", nunca un video sin subtítulos. Si necesitas llamar la atención,
usa el patrón `alerta-visual` de la §8.

---

## 1. Stack y no negociables técnicos

| Pieza           | Qué usamos                                      | Regla                                                                                         |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Estilos         | Tailwind CSS v4 (config en CSS, `@theme`)       | **No crear `tailwind.config.js`.** Todo va en `src/styles/globals.css`.                       |
| Componentes     | shadcn sobre **Base UI** (`style: "base-vega"`) | Base UI **no usa `asChild`** — usa la prop `render`. No copiar snippets de Radix sin adaptar. |
| Primitivas      | `@base-ui/react`                                | Nunca importarla directo en pantallas; siempre a través de `src/components/ui/*`.             |
| Íconos          | `lucide-react`                                  | `strokeWidth={2}`, tamaño por clase (`size-4`, `size-5`). Decorativo → `aria-hidden="true"`.  |
| Tipografía      | `@fontsource-variable/geist`                    | Importar una sola vez en `src/main.tsx`.                                                      |
| Variantes       | `class-variance-authority` + `cn()`             | Toda variante visual se declara con CVA. Nada de ternarios de clases sueltos.                 |
| Merge de clases | `clsx` + `tailwind-merge` vía `cn()`            | `src/lib/utils.ts`.                                                                           |
| Animación       | `tw-animate-css`                                | Solo las animaciones listadas en §9.                                                          |
| Estado servidor | `@tanstack/react-query`                         | Cupos, aulas, reservas, historial. **Nunca** en Zustand.                                      |
| Estado UI       | `zustand`                                       | Filtros, modales, y el store de preferencias de accesibilidad (§10).                          |
| Rutas           | `react-router-dom` v6                           | Cada cambio de ruta mueve el foco al `<h1>` (§7.4).                                           |

---

## 2. Los 7 principios de diseño

1. **La accesibilidad es el producto.** Si una decisión mejora una métrica pero empeora la
   experiencia de un usuario sordo, la decisión es incorrecta. No se negocia.
2. **Legible antes que bonito.** Ante la duda: más contraste, más tamaño, más espacio.
3. **Explícito antes que elegante.** Un botón que dice `Reservar mi cupo` gana siempre contra
   un ícono solitario de bookmark. El texto no es ruido, es la interfaz.
4. **El estado siempre visible.** El usuario nunca debe preguntarse "¿se guardó?", "¿tengo cupo?",
   "¿ya puedo entrar?". Cada pantalla responde eso sin que haya que buscar.
5. **Los bordes antes que las sombras.** La elevación se expresa con borde de 1px + fondo;
   la sombra es un refuerzo secundario. Un borde sobrevive al modo alto contraste; una sombra no.
6. **El teclado es ciudadano de primera.** Todo flujo se completa sin mouse. El foco siempre visible.
7. **Confianza como activo frágil.** Público vulnerable. Un modal ambiguo, un botón destructivo
   sin confirmación o una clase perdida por un bug cuestan más aquí que en un producto genérico.

---

## 3. Paleta: de dónde sale

No es una paleta escogida por gusto. Tiene tres anclas:

- **Azul primario.** Azul = confianza, calma, estabilidad, comunicación. Es el color que se
  usa para instituciones educativas y para todo lo que pide que el usuario deposite datos y
  tiempo. El documento del proyecto ya se marca a sí mismo con 💙.
- **Ámbar de atención.** Azul y amarillo son, históricamente, los colores asociados a la
  comunidad sorda a nivel internacional. Aquí el ámbar **no** es un color de marca suelto:
  es el color del **tiempo**. Se reserva exclusivamente para lo temporal y lo urgente
  (la ventana de 30 minutos, "quedan 2 cupos", recordatorios). Eso lo vuelve informativo:
  cuando el usuario ve ámbar, sabe que hay un reloj corriendo.
- **Neutros con tinte azul.** Los grises llevan un rastro de croma del primario (hue 250-258),
  no son grises puros. Da cohesión sin ruido y evita el gris "cadáver" de los dashboards genéricos.

Verde y rojo se usan **solo** para éxito/error, nunca para categorizar, y siempre acompañados de
ícono (≈8% de hombres tiene deficiencia rojo-verde).

Todos los valores están en **OKLCH** (uniforme perceptualmente: cambiar `L` cambia la claridad real,
no la percibida) y verificados dentro del gamut sRGB.

### Contrastes verificados (modo claro)

| Par                                          | Ratio      | Nivel                 |
| -------------------------------------------- | ---------- | --------------------- |
| `foreground` sobre `background`              | **16.2:1** | AAA                   |
| `muted-foreground` sobre `background`        | **5.9:1**  | AA (usar solo ≥ 15px) |
| Blanco sobre `primary-700` (botón principal) | **7.8:1**  | AAA                   |
| Blanco sobre `destructive` (`danger-700`)    | **7.5:1**  | AAA                   |
| Blanco sobre `success-700`                   | **6.2:1**  | AA                    |
| `foreground` sobre `attention-500`           | **8.5:1**  | AAA                   |
| Borde de input sobre fondo                   | **3.4:1**  | Cumple 1.4.11 (≥3:1)  |
| Anillo de foco sobre fondo                   | **5.5:1**  | Cumple con margen     |

**Metas obligatorias:** texto normal ≥ **7:1** (AAA) siempre que se pueda, mínimo absoluto 4.5:1.
Bordes de controles y elementos gráficos con significado ≥ 3:1. Si un diseño no llega, se cambia
el diseño, no la meta.

---

## 4. Tokens de color

### 4.1 `src/styles/globals.css` completo

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));
/* Modo alto contraste elegible por el usuario en su perfil de accesibilidad */
@custom-variant hc (&:is(.hc *));

/* ─────────────────────────────────────────────
   MODO CLARO (por defecto)
   ───────────────────────────────────────────── */
:root {
  --radius: 0.75rem;

  /* Superficies y texto */
  --background: oklch(0.99 0.004 250); /* #FAFCFE */
  --foreground: oklch(0.235 0.038 258); /* #131E30 — tinta azulada, no negro puro */
  --card: oklch(1 0 0); /* #FFFFFF */
  --card-foreground: oklch(0.235 0.038 258);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.235 0.038 258);
  --muted: oklch(0.963 0.012 250); /* #EDF4FB */
  --muted-foreground: oklch(0.495 0.032 256); /* #566374 */

  /* Marca — azul */
  --primary: oklch(0.445 0.168 259); /* #054DAE — primary-700, AAA con blanco */
  --primary-foreground: oklch(1 0 0);
  --primary-hover: oklch(0.372 0.138 259); /* #053B87 */
  --primary-soft: oklch(0.972 0.011 250); /* #F0F7FD — fondo de chips/estados */
  --primary-soft-foreground: oklch(0.372 0.138 259);

  /* Secundario (superficie neutra interactiva) */
  --secondary: oklch(0.963 0.012 250);
  --secondary-foreground: oklch(0.372 0.138 259);

  /* OJO: --accent es el token de hover neutro que usa shadcn. NO lo pintes de ámbar. */
  --accent: oklch(0.963 0.012 250);
  --accent-foreground: oklch(0.235 0.038 258);

  /* ÁMBAR = TIEMPO. Único uso: urgencia, ventanas temporales, últimos cupos. */
  --attention: oklch(0.79 0.155 80); /* #EEAE25 */
  --attention-foreground: oklch(0.235 0.038 258); /* tinta sobre ámbar, nunca blanco */
  --attention-soft: oklch(0.958 0.042 90); /* #FCF1D2 */
  --attention-soft-foreground: oklch(0.38 0.085 55); /* #64340C */
  --attention-border: oklch(0.86 0.115 85); /* #F4CB75 */

  /* Éxito — verde azulado, se distingue del ámbar para daltonismo */
  --success: oklch(0.48 0.098 163); /* #116E4D */
  --success-foreground: oklch(1 0 0);
  --success-soft: oklch(0.95 0.038 165); /* #D8F7E8 */
  --success-soft-foreground: oklch(0.33 0.068 164);
  --success-border: oklch(0.68 0.13 162);

  /* Destructivo */
  --destructive: oklch(0.47 0.172 25); /* #A61C23 */
  --destructive-foreground: oklch(1 0 0);
  --destructive-soft: oklch(0.947 0.024 22); /* #FDE8E6 */
  --destructive-soft-foreground: oklch(0.33 0.11 25);
  --destructive-border: oklch(0.62 0.19 22);

  /* Informativo */
  --info: oklch(0.52 0.18 258);
  --info-foreground: oklch(1 0 0);
  --info-soft: oklch(0.936 0.032 250);
  --info-soft-foreground: oklch(0.3 0.103 260);

  /* Líneas y foco */
  --border: oklch(0.9 0.016 250); /* separadores decorativos */
  --input: oklch(0.63 0.03 252); /* borde de controles — 3.4:1, NO usar --border aquí */
  --ring: oklch(0.52 0.18 258); /* #1364CE */

  /* Gráficas (si llegan métricas en admin) */
  --chart-1: oklch(0.445 0.168 259);
  --chart-2: oklch(0.68 0.13 162);
  --chart-3: oklch(0.79 0.155 80);
  --chart-4: oklch(0.62 0.19 22);
  --chart-5: oklch(0.495 0.032 256);

  /* Sidebar (panel de profesor / admin) */
  --sidebar: oklch(0.99 0.004 250);
  --sidebar-foreground: oklch(0.235 0.038 258);
  --sidebar-primary: oklch(0.445 0.168 259);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.963 0.012 250);
  --sidebar-accent-foreground: oklch(0.372 0.138 259);
  --sidebar-border: oklch(0.9 0.016 250);
  --sidebar-ring: oklch(0.52 0.18 258);
}

/* ─────────────────────────────────────────────
   MODO OSCURO
   ───────────────────────────────────────────── */
.dark {
  --background: oklch(0.205 0.022 258); /* #111721 */
  --foreground: oklch(0.965 0.008 250); /* #F0F4F9 */
  --card: oklch(0.255 0.026 258); /* #1B232F */
  --card-foreground: oklch(0.965 0.008 250);
  --popover: oklch(0.255 0.026 258);
  --popover-foreground: oklch(0.965 0.008 250);
  --muted: oklch(0.305 0.028 258);
  --muted-foreground: oklch(0.755 0.026 254); /* #A5B1C0 — 8.2:1 */

  --primary: oklch(0.72 0.135 254); /* #65A8F7 */
  --primary-foreground: oklch(0.19 0.045 258);
  --primary-hover: oklch(0.79 0.11 254);
  --primary-soft: oklch(0.32 0.07 258);
  --primary-soft-foreground: oklch(0.87 0.058 252);

  --secondary: oklch(0.305 0.028 258);
  --secondary-foreground: oklch(0.965 0.008 250);
  --accent: oklch(0.305 0.028 258);
  --accent-foreground: oklch(0.965 0.008 250);

  --attention: oklch(0.83 0.135 82); /* #F3BE55 */
  --attention-foreground: oklch(0.23 0.06 60);
  --attention-soft: oklch(0.33 0.06 65);
  --attention-soft-foreground: oklch(0.9 0.085 88);
  --attention-border: oklch(0.83 0.135 82);

  --success: oklch(0.76 0.12 162);
  --success-foreground: oklch(0.2 0.04 164);
  --success-soft: oklch(0.32 0.055 163);
  --success-soft-foreground: oklch(0.88 0.085 164);
  --success-border: oklch(0.76 0.12 162);

  --destructive: oklch(0.7 0.15 22);
  --destructive-foreground: oklch(0.2 0.05 25);
  --destructive-soft: oklch(0.32 0.075 23);
  --destructive-soft-foreground: oklch(0.868 0.058 22);
  --destructive-border: oklch(0.7 0.15 22);

  --info: oklch(0.72 0.135 254);
  --info-foreground: oklch(0.19 0.045 258);
  --info-soft: oklch(0.32 0.07 258);
  --info-soft-foreground: oklch(0.87 0.058 252);

  --border: oklch(0.37 0.03 258);
  --input: oklch(0.548 0.035 256); /* 3.2:1 sobre card */
  --ring: oklch(0.78 0.112 254); /* #84BBFE */

  --chart-1: oklch(0.72 0.135 254);
  --chart-2: oklch(0.76 0.12 162);
  --chart-3: oklch(0.83 0.135 82);
  --chart-4: oklch(0.7 0.15 22);
  --chart-5: oklch(0.755 0.026 254);

  --sidebar: oklch(0.255 0.026 258);
  --sidebar-foreground: oklch(0.965 0.008 250);
  --sidebar-primary: oklch(0.72 0.135 254);
  --sidebar-primary-foreground: oklch(0.19 0.045 258);
  --sidebar-accent: oklch(0.305 0.028 258);
  --sidebar-accent-foreground: oklch(0.965 0.008 250);
  --sidebar-border: oklch(0.37 0.03 258);
  --sidebar-ring: oklch(0.78 0.112 254);
}

/* ─────────────────────────────────────────────
   ALTO CONTRASTE (opt-in desde el perfil del usuario)
   Sube todo a ~21:1 y engrosa bordes.
   ───────────────────────────────────────────── */
.hc {
  --background: oklch(1 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.3 0 0);
  --primary: oklch(0.3 0.14 259);
  --primary-foreground: oklch(1 0 0);
  --border: oklch(0.25 0 0);
  --input: oklch(0.2 0 0);
  --ring: oklch(0.2 0.14 259);
}
.hc.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(1 0 0);
  --card: oklch(0.12 0 0);
  --card-foreground: oklch(1 0 0);
  --muted-foreground: oklch(0.85 0 0);
  --border: oklch(0.8 0 0);
  --input: oklch(0.85 0 0);
  --ring: oklch(0.9 0.08 254);
}
.hc *,
.hc *::before,
.hc *::after {
  border-width: max(1px, var(--tw-border-style, 1px));
}
.hc :focus-visible {
  outline-width: 4px !important;
}

/* Respeta también la preferencia del sistema */
@media (prefers-contrast: more) {
  :root {
    --muted-foreground: oklch(0.38 0.03 256);
    --input: oklch(0.5 0.03 252);
  }
}

/* ─────────────────────────────────────────────
   EXPOSICIÓN A TAILWIND
   ───────────────────────────────────────────── */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-primary-soft: var(--primary-soft);
  --color-primary-soft-foreground: var(--primary-soft-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-attention: var(--attention);
  --color-attention-foreground: var(--attention-foreground);
  --color-attention-soft: var(--attention-soft);
  --color-attention-soft-foreground: var(--attention-soft-foreground);
  --color-attention-border: var(--attention-border);

  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-success-soft: var(--success-soft);
  --color-success-soft-foreground: var(--success-soft-foreground);
  --color-success-border: var(--success-border);

  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-soft: var(--destructive-soft);
  --color-destructive-soft-foreground: var(--destructive-soft-foreground);
  --color-destructive-border: var(--destructive-border);

  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-info-soft: var(--info-soft);
  --color-info-soft-foreground: var(--info-soft-foreground);

  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

### 4.2 Diccionario de color — qué significa cada uno

| Token         | Significado exclusivo                           | Ejemplos                                                        |
| ------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `primary`     | Acción principal / lo que es tuyo               | Botón "Reservar mi cupo", aula reservada por ti, enlace activo  |
| `attention`   | **Tiempo.** Urgencia, ventana temporal, escasez | "Quedan 2 cupos", "El acceso abre en 12 min", recordatorio 24 h |
| `success`     | Confirmado, disponible, completado              | "Reserva confirmada", "Hay cupo", asistencia marcada            |
| `destructive` | Pérdida o error                                 | Cancelar reserva, clase cancelada, error de validación          |
| `info`        | Contexto neutro, ayuda                          | Explicación de la ventana de 30 min, tooltips informativos      |
| `muted`       | Inactivo, pasado, sin acción posible            | Clase finalizada, aula llena, campo deshabilitado               |

**Prohibido:** usar `attention` como color de marca en headers, logos, hero o adornos.
Si el ámbar aparece cuando no hay nada urgente, deja de significar urgencia y perdemos la señal.

---

## 5. Tipografía

Los estudiantes están leyendo en **español** una plataforma que enseña **inglés**, muchos sin
soporte fonológico. La lectura es el canal principal, no un canal secundario. Por eso el cuerpo
base es de 17px, no de 16px.

```css
/* en @theme del globals.css */
@theme {
  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', 'Liberation Mono', monospace;

  --text-xs: 0.8125rem;
  --text-xs--line-height: 1.5; /* 13px — solo metadatos */
  --text-sm: 0.9375rem;
  --text-sm--line-height: 1.55; /* 15px — labels, ayudas */
  --text-base: 1.0625rem;
  --text-base--line-height: 1.65; /* 17px — CUERPO */
  --text-lg: 1.1875rem;
  --text-lg--line-height: 1.6; /* 19px — intro, lead */
  --text-xl: 1.375rem;
  --text-xl--line-height: 1.45; /* 22px — h3 */
  --text-2xl: 1.75rem;
  --text-2xl--line-height: 1.3; /* 28px — h2 */
  --text-3xl: 2.125rem;
  --text-3xl--line-height: 1.2; /* 34px — h1 */
  --text-4xl: 2.75rem;
  --text-4xl--line-height: 1.1; /* 44px — hero */
}
```

**Reglas duras:**

- **Nunca** texto por debajo de `text-xs` (13px). Y `text-xs` solo para metadatos no críticos.
- **Nunca** `text-justify`. Los ríos de espacio blanco rompen el seguimiento visual. Siempre a la izquierda.
- Ancho máximo de párrafo: **`max-w-[65ch]`**. Sin excepción en textos de ayuda o explicaciones.
- Interlineado mínimo 1.5 en cuerpo (ya está en el escala). Espacio entre párrafos ≥ 1.5em.
- Jerarquía por **peso y tamaño**, no por color. Un `h2` gris claro no es una jerarquía, es un problema.
- Pesos: 400 cuerpo, 500 labels y botones, 600 títulos, 700 solo para cifras destacadas. **Nunca 300 o menos.**
- Números en tablas, contadores y horarios: `font-variant-numeric: tabular-nums` (clase `tabular-nums`).
  Un contador que "salta" es ruido visual.
- **Nunca `text-transform: uppercase`** en frases. Las mayúsculas sostenidas destruyen la silueta de
  la palabra y bajan la velocidad de lectura. Solo se permite en etiquetas de una palabra (`NUEVO`).

### 5.1 Contenido en inglés

Es una academia de inglés: la interfaz es española pero el contenido enseñado no.

```tsx
<p>
  Practica la frase: <Ingles>Nice to meet you</Ingles>
</p>
```

```tsx
// src/components/ui/ingles.tsx
export function Ingles({ children }: { children: React.ReactNode }) {
  return (
    <span lang="en" className="font-medium tracking-[0.01em]">
      {children}
    </span>
  );
}
```

- **Todo** texto en inglés lleva `lang="en"`. El `<html>` lleva `lang="es"`. Esto no es cosmético:
  los lectores de pantalla cambian de voz y los correctores dejan de marcarlo mal.
- Verifica que la fuente distinga bien `I` mayúscula, `l` minúscula y `1`. Si en Geist quedan
  ambiguas en el contenido de aprendizaje, añade `tracking-[0.02em]` a `<Ingles>` o cambia
  esa capa a una fuente con formas inequívocas. En una plataforma que enseña a deletrear,
  confundir `Ill` con `III` es un bug de producto.

---

## 6. Espaciado, forma y elevación

**Escala:** múltiplos de 4, preferentemente de 8. Usa `gap-*` en flex/grid, no márgenes sueltos.

| Uso                                 | Valor                                           |
| ----------------------------------- | ----------------------------------------------- |
| Dentro de un control (botón, input) | `px-4 py-2.5` / `px-5 py-3`                     |
| Entre elementos relacionados        | `gap-2` / `gap-3`                               |
| Entre bloques dentro de una tarjeta | `gap-4` / `gap-6`                               |
| Entre secciones de página           | `gap-10` (móvil) / `gap-14` (desktop)           |
| Padding de tarjeta                  | `p-5` (móvil) / `p-6` (desktop)                 |
| Contenedor de página                | `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8` |

**Radios:** `--radius: 0.75rem`. Botones e inputs `rounded-lg`, tarjetas `rounded-xl`,
badges y chips `rounded-full`, avatares `rounded-full`. Nada de `rounded-none`: los bordes duros
leen como "sistema legacy" y este producto necesita leerse como cercano.

**Elevación (bordes primero):**

| Nivel                        | Receta                                                                |
| ---------------------------- | --------------------------------------------------------------------- |
| Base                         | `bg-card border border-border`                                        |
| Interactivo                  | `+ hover:border-input transition-colors`                              |
| Flotante (popover, dropdown) | `bg-popover border border-border shadow-lg`                           |
| Modal                        | `bg-card border border-border shadow-xl` + overlay `bg-foreground/50` |

Sombras solo en capas flotantes. Nunca sombras de color, nunca glow.

**Áreas táctiles:**

- Mínimo **44×44px** para cualquier cosa clicable.
- **48px de alto** para acciones primarias y para todo en móvil.
- Separación mínima de **8px** entre dos objetivos táctiles.
- Un ícono de 20px dentro de un botón de 44px: el objetivo es el botón, no el ícono.

---

## 7. Accesibilidad — checklist obligatorio

Esto no es una sección de "buenas prácticas". Es el criterio de aceptación.

### 7.1 Foco

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  :focus-visible {
    outline: 3px solid var(--ring);
    outline-offset: 2px;
    border-radius: calc(var(--radius) - 2px);
  }
}
```

- Anillo de **3px** (no 2px) con **2px de offset**. El offset garantiza contraste sobre cualquier fondo.
- **Jamás** `outline: none` sin reemplazo equivalente. Si ves esa línea en el código, es un bug.
- El orden de tabulación sigue el orden visual. Nada de `tabIndex` positivos.
- Todo modal, sheet y popover atrapa el foco y lo devuelve al disparador al cerrarse
  (Base UI ya lo hace — no lo desactives).

### 7.2 Semántica

- Un solo `<h1>` por página. Sin saltos de nivel (`h2` → `h4` está mal).
- `<button>` para acciones, `<a>` para navegación. Nunca un `<div onClick>`.
- Landmarks siempre: `<header>`, `<nav>`, `<main>`, `<footer>`. `<main>` con `id="contenido"`.
- Primer elemento enfocable del documento: enlace "Saltar al contenido" (visible al enfocar).
- Íconos decorativos: `aria-hidden="true"`. Íconos que son la única etiqueta: `aria-label` con
  texto real — pero prefiere siempre ícono + texto visible.

### 7.3 Formularios

- Todo input con `<label>` **visible**. Placeholder ≠ label; el placeholder desaparece al escribir.
- Errores: texto **junto al campo**, `aria-invalid="true"`, `aria-describedby` apuntando al mensaje,
  ícono `CircleAlert` y borde `destructive-border`. **Nunca** solo borde rojo.
- El mensaje de error dice qué pasó y cómo arreglarlo: `La fecha debe ser posterior a hoy`,
  no `Fecha inválida`.
- Al enviar con errores: mueve el foco al primer campo con error.
- Campos obligatorios marcados con la palabra `(obligatorio)`, no solo con un asterisco.
- `autocomplete` correcto en registro y login (`email`, `new-password`, `current-password`, `name`).

### 7.4 Navegación entre rutas

Un cambio de ruta en una SPA es silencioso para lectores de pantalla. En cada navegación:

```tsx
// Al montar una página
useEffect(() => {
  tituloRef.current?.focus();
  document.title = `${titulo} · BigHearts`;
}, [titulo]);
// <h1 ref={tituloRef} tabIndex={-1} className="outline-none">
```

### 7.5 Anuncios dinámicos

Todo cambio importante que no sea un cambio de ruta va a una región viva:

- `aria-live="polite"` → confirmaciones, actualización de cupos, resultados de filtros
  (`"12 aulas encontradas"`).
- `aria-live="assertive"` → solo errores que bloquean el flujo.
- Un solo contenedor `<div aria-live="polite" className="sr-only" />` montado en el layout raíz,
  alimentado por un hook `useAnuncio()`.

### 7.6 Video (fases futuras, pero se diseña desde ya)

- Ningún video con `autoplay`. Ningún video sin subtítulos (`<track kind="captions" srcLang="es">`).
- Reserva en el layout un espacio para el intérprete/avatar de señas de la Fase 3:
  contenedor `aspect-[3/4]` alineado a la derecha del contenido, colapsable, nunca superpuesto
  al texto. Componente placeholder: `<PanelSenas />`.

---

## 8. Patrones del dominio

Estos son los componentes que hacen a BigHearts distinto de un CRUD cualquiera.
Deben existir como componentes reutilizables, no reimplementarse por pantalla.

### 8.1 `<EstadoAula />` — el diccionario de estados

Estado siempre = **color + ícono + texto**. Esta tabla es la única fuente de verdad:

| Estado                 | Color                | Ícono (lucide)   | Texto visible             |
| ---------------------- | -------------------- | ---------------- | ------------------------- |
| `disponible`           | `success-soft`       | `CircleCheck`    | `Hay cupo`                |
| `ultimos-cupos`        | `attention-soft`     | `TriangleAlert`  | `Quedan {n} cupos`        |
| `llena`                | `muted`              | `Users`          | `Sin cupos`               |
| `reservada`            | `primary-soft`       | `BookmarkCheck`  | `Tienes tu cupo`          |
| `acceso-abierto`       | `attention` (sólido) | `DoorOpen`       | `Ya puedes entrar`        |
| `en-curso`             | `success` (sólido)   | `Video`          | `Clase en curso`          |
| `finalizada`           | `muted`              | `CircleCheckBig` | `Clase finalizada`        |
| `cancelada`            | `destructive-soft`   | `CircleX`        | `Clase cancelada`         |
| `pendiente-aprobacion` | `attention-soft`     | `Clock`          | `Pendiente de aprobación` |

```tsx
const estadoAula = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
  {
    variants: {
      estado: {
        disponible: 'bg-success-soft text-success-soft-foreground border-success-border',
        ultimosCupos: 'bg-attention-soft text-attention-soft-foreground border-attention-border',
        llena: 'bg-muted text-muted-foreground border-border',
        reservada: 'bg-primary-soft text-primary-soft-foreground border-primary/30',
        accesoAbierto: 'bg-attention text-attention-foreground border-attention',
        enCurso: 'bg-success text-success-foreground border-success',
        finalizada: 'bg-muted text-muted-foreground border-border',
        cancelada: 'bg-destructive-soft text-destructive-soft-foreground border-destructive-border',
        pendiente: 'bg-attention-soft text-attention-soft-foreground border-attention-border',
      },
    },
    defaultVariants: { estado: 'disponible' },
  },
);
```

### 8.2 El riel de estado — la firma visual del producto

Cada `<TarjetaAula>` lleva una **franja vertical de 4px en su borde izquierdo** con el color del
estado. Es el elemento que hace reconocible la interfaz y, más importante, permite **escanear una
lista completa con visión periférica** sin leer una sola palabra. Para un usuario que procesa
todo por la vista, esto vale más que cualquier animación.

```tsx
<article
  className="relative overflow-hidden rounded-xl border border-border bg-card p-5
                    focus-within:ring-2 focus-within:ring-ring"
>
  <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-success" />
  ...
</article>
```

El riel es **redundante** con el badge de estado — a propósito. La redundancia es la
estrategia central de este diseño, no un descuido.

### 8.3 `<VentanaDeAcceso />` — el corazón del producto

La regla de negocio más importante es que el enlace solo se revela 30 minutos antes.
Esa regla merece su propio componente, siempre visible en el detalle del aula, con 5 fases:

| Fase                  | Fondo              | Ícono            | Titular                           | Cuerpo                                           |
| --------------------- | ------------------ | ---------------- | --------------------------------- | ------------------------------------------------ |
| Sin reserva           | `muted`            | `Lock`           | `Reserva para acceder`            | `El enlace solo se muestra a quien tiene cupo.`  |
| Falta mucho (>30 min) | `info-soft`        | `Clock`          | `El acceso abre 30 minutos antes` | Cuenta regresiva en `tabular-nums` + hora exacta |
| Abre pronto (<30 min) | `attention-soft`   | `Clock`          | `El acceso abre en {mm}:{ss}`     | Barra de progreso con `aria-valuenow`            |
| Abierto               | `attention` sólido | `DoorOpen`       | `Ya puedes entrar`                | Botón grande `Entrar a la clase`                 |
| Terminada             | `muted`            | `CircleCheckBig` | `Esta clase ya terminó`           | Enlace a `Ver mi historial`                      |

Requisitos:

- La cuenta regresiva se anuncia con `aria-live="polite"` **solo en hitos** (30, 15, 5, 1 min),
  no cada segundo.
- El paso de "abre pronto" a "abierto" dispara la `alerta-visual` de §9. Este es el único momento
  del producto donde un usuario oyente recibiría una notificación sonora, así que aquí la
  compensación visual es obligatoria.
- El botón `Entrar a la clase` es el objetivo táctil más grande de toda la app: `h-14`, ancho
  completo en móvil, `text-lg`.

### 8.4 `<IndicadorCupo />`

Nunca porcentajes ni gráficas circulares. Siempre conteo literal:

```
👥 14 de 20 lugares ocupados · Quedan 6
```

- Barra de progreso con `role="progressbar"`, `aria-valuemin/max/now` y `aria-valuetext="Quedan 6 de 20 lugares"`.
- Color: `success` con >3 libres, `attention` con 1-3 libres, `muted` con 0.
- Si quedan 0 el texto cambia a `Sin cupos disponibles` y el botón de reservar se **oculta**
  y se reemplaza por texto explicativo — no se deja deshabilitado sin explicación.

### 8.5 Acciones destructivas

Cancelar una reserva o un aula **siempre** pasa por `<AlertDialog>` con:

- Título que nombra el objeto: `¿Cancelar tu reserva de "Inglés básico — martes 6 p.m."?`
- Consecuencia explícita: `Tu lugar quedará disponible para otro estudiante.`
- Botones con verbos, no con Sí/No: `Cancelar mi reserva` (destructive) / `Volver` (outline).
- El botón seguro (`Volver`) recibe el foco inicial.

---

## 9. Movimiento

El movimiento aquí **sustituye al sonido**, así que se usa con propósito y con cuidado.

```css
@theme {
  --ease-suave: cubic-bezier(0.22, 1, 0.36, 1);
  --duracion-rapida: 150ms;
  --duracion-normal: 220ms;
  --duracion-lenta: 320ms;
}

/* Alerta visual: el equivalente accesible de un "ding". */
@keyframes alerta-visual {
  0% {
    box-shadow: 0 0 0 0 var(--attention);
  }
  50% {
    box-shadow: 0 0 0 8px color-mix(in oklch, var(--attention) 35%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}
.alerta-visual {
  animation: alerta-visual 900ms var(--ease-suave) 2;
}
```

**Reglas:**

- La `alerta-visual` corre **máximo 2 ciclos** y nunca es un parpadeo rápido. Nunca superar
  3 destellos por segundo (riesgo fotosensible, WCAG 2.3.1). Nada de estrobos ni de invertir
  el color de pantalla completa.
- El movimiento **nunca** es la única señal: siempre acompaña un cambio de texto y de color.
- Transiciones permitidas: `colors`, `opacity`, `transform` (≤ 4px de desplazamiento).
  Prohibido: parallax, rebotes, rotaciones, `scale` > 1.03, animaciones al hacer scroll.
- Toasts: **mínimo 8 segundos** visibles (el usuario no puede "oír" que pasó algo mientras
  mira otra parte de la pantalla) y siempre con botón de cerrar. Los mensajes críticos
  **no se auto-cierran**.
- Skeletons con `animate-pulse` sí; spinners infinitos sin texto no. Todo estado de carga
  lleva texto: `Cargando aulas disponibles…`.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Y respeta también la preferencia guardada en el perfil del usuario (§10), no solo la del sistema.

---

## 10. Preferencias de accesibilidad del usuario

El documento del proyecto define que el estudiante indica su **nivel de hipoacusia** y su
**preferencia de comunicación** al registrarse. Eso alimenta un store persistido:

```ts
// src/stores/preferencias-accesibilidad.ts
type Preferencias = {
  tema: 'claro' | 'oscuro' | 'sistema';
  altoContraste: boolean;
  movimientoReducido: boolean;
  tamanoTexto: 'normal' | 'grande' | 'muy-grande'; // 100% / 112.5% / 125%
  preferenciaComunicacion: 'texto' | 'senas' | 'ambos';
};
```

- Se aplican como clases en `<html>`: `dark`, `hc`, `texto-grande`.
- `tamanoTexto` modifica `font-size` del `:root` (`17px` / `19px` / `21px`), no cada componente.
- **Todas** las preferencias son cambiables desde una pantalla de Ajustes accesible en 1 clic
  desde cualquier página. Nadie debería tener que volver al registro para arreglar su contraste.
- `preferenciaComunicacion: "senas"` prioriza el `<PanelSenas />` y reduce la densidad de texto
  en ayudas (versión corta primero, "Ver explicación completa" desplegable).

---

## 11. Voz y microcopy

El texto es la interfaz. Se escribe con la misma disciplina que el espaciado.

- **Español neutro, sin regionalismos.** Frases cortas: máximo ~15 palabras.
- **Literal, nunca figurado.** Muchos usuarios tienen la lengua de señas como primer idioma y el
  español escrito como segundo. Nada de "¡Ups!", "se nos fue el avión", "en un abrir y cerrar de ojos".
- **Voz activa y el mismo verbo en todo el flujo.** El botón dice `Reservar mi cupo` → el toast dice
  `Cupo reservado`. Nunca `Enviar`, nunca `Aceptar` a secas.
- **Los errores no se disculpan, explican.**
  - ✅ `No pudimos guardar tu reserva. Revisa tu conexión e inténtalo otra vez.`
  - ❌ `¡Ups! Algo salió mal 😅`
- **Los vacíos invitan a actuar.**
  - ✅ `Todavía no tienes clases reservadas. Explora las aulas disponibles.` + botón.
  - ❌ `Sin resultados.`
- **Nombra lo que el usuario controla, no cómo está construido.** `Recordatorios por correo`,
  no `Configuración de notificaciones SMTP`.
- Sentence case en todo: botones, títulos, labels y menús. Nunca Title Case en español.
- Fechas y horas siempre completas y explícitas: `Martes 12 de agosto, 6:00 p.m. (hora de Colombia)`.
  Nunca `12/08` solo. Nunca formato relativo como única información (`en 2 días` va acompañado de la fecha).

---

## 12. Convenciones de código

```
src/
├─ components/
│  ├─ ui/            # shadcn generado (base-vega). Se edita, no se envuelve dos veces.
│  └─ dominio/       # EstadoAula, VentanaDeAcceso, IndicadorCupo, TarjetaAula, PanelSenas
├─ features/
│  ├─ auth/          # componentes, hooks y api de cada dominio
│  ├─ aulas/
│  ├─ reservas/
│  └─ perfil/
├─ hooks/            # useAnuncio, useCuentaRegresiva, usePreferencias
├─ lib/              # utils.ts (cn), api.ts (axios), fechas.ts
├─ stores/           # zustand
└─ styles/globals.css
```

**Reglas de escritura de componentes:**

1. **Cero colores literales.** Ni `#0062D6`, ni `blue-600`, ni `oklch(...)` en un `.tsx`.
   Solo tokens: `bg-primary`, `text-muted-foreground`. Si falta un token, se agrega al `globals.css`
   con su par `-foreground` y su entrada en el diccionario de §4.2.
2. **Toda variante con CVA**, exportando también el tipo:
   ```ts
   export type BotonProps = VariantProps<typeof botonVariants> & ...
   ```
3. **Base UI usa `render`, no `asChild`:**
   ```tsx
   // ❌ Radix
   <Button asChild><Link to="/aulas">Ver aulas</Link></Button>
   // ✅ Base UI
   <Button render={<Link to="/aulas" />}>Ver aulas</Button>
   ```
4. **`cn()` siempre al final** para que las clases del consumidor puedan sobrescribir:
   `className={cn(botonVariants({ variant }), className)}`.
5. **Estados de UI obligatorios.** Ninguna pantalla se considera lista sin sus cuatro estados
   implementados: `cargando` (skeleton + texto), `vacío` (mensaje + acción), `error`
   (qué pasó + cómo reintentar), `éxito`. React Query da `isPending`/`isError`; úsalos, no los ignores.
6. **Mutaciones optimistas prohibidas en reservas.** El cupo es un recurso con concurrencia real;
   mostrar "reservado" antes de la confirmación del servidor es mentirle al usuario sobre algo
   que le importa. Estado de carga explícito y confirmación real.
7. **Nada de `dangerouslySetInnerHTML`.** Público vulnerable, datos personales: cero superficie XSS.
8. **`type` para props, `interface` solo al extender.** Props de dominio importadas de `@academia/types`.

---

## 13. Prohibido

| ❌ No hacer                                        | Por qué                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| Comunicar estado solo con color                    | Daltonismo, alto contraste, capturas en gris                      |
| `outline: none` sin reemplazo                      | Rompe la navegación por teclado, que aquí es crítica              |
| Sonidos, `<audio>`, "escucha el aviso"             | El usuario no oye. Literalmente                                   |
| Video sin subtítulos o con autoplay                | Contenido inaccesible para el 100% del público objetivo           |
| Placeholder como única etiqueta                    | Desaparece al escribir; el usuario pierde el contexto             |
| Texto sobre imagen o gradiente                     | Contraste impredecible                                            |
| Ámbar como color decorativo                        | Quema la señal de urgencia, que es la más importante del producto |
| `text-justify` o texto centrado en párrafos largos | Rompe el seguimiento visual línea a línea                         |
| Tooltip como único portador de información         | No existe en táctil, es frágil con teclado                        |
| Modales anidados                                   | Trampa de foco y de comprensión                                   |
| Íconos sin etiqueta de texto en acciones primarias | La iconografía no es un idioma universal                          |
| Deshabilitar un botón sin explicar por qué         | El usuario no puede diagnosticarlo. Explica o esconde             |
| Pesos tipográficos < 400                           | Ilegible en pantallas medianas y con baja visión asociada         |

---

## 14. Checklist antes de dar un componente por terminado

- [ ] Se completa el flujo entero **solo con teclado**, con foco visible en cada paso.
- [ ] Cada estado se lee sin color (color + ícono + texto).
- [ ] Texto ≥ 7:1 de contraste, o ≥ 4.5:1 con justificación explícita.
- [ ] Objetivos táctiles ≥ 44px (48px si es acción primaria o si es móvil).
- [ ] Funciona en `.dark` y en `.hc`.
- [ ] Funciona con `prefers-reduced-motion: reduce`.
- [ ] Tiene los cuatro estados: cargando, vacío, error, éxito.
- [ ] Ningún color literal en el `.tsx`; solo tokens.
- [ ] Zoom del navegador al 200% sin scroll horizontal ni texto cortado.
- [ ] Ancho de línea ≤ 65ch en textos largos.
- [ ] Ningún dato importante depende de audio, hover o tooltip.
- [ ] Los cambios dinámicos se anuncian por `aria-live`.
- [ ] Textos en inglés envueltos en `<Ingles>` con `lang="en"`.

---

> **La prueba definitiva del documento del proyecto:** _si un estudiante sordo entra, encuentra
> su clase, reserva y llega a la videollamada sin pedirle ayuda a nadie, el producto funcionó._
> Cuando dudes entre dos opciones de diseño, esa es la pregunta que decide.
