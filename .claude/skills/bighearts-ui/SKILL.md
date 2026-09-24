---
name: bighearts-ui
description: Convenciones de UI de BigHearts (academia de inglés para personas sordas) — color con significado, tipografía, accesibilidad, movimiento y patrones de componentes. Úsalo al crear o editar componentes, pantallas, estilos Tailwind, formularios o copy de interfaz.
license: Proprietary
---

# BigHearts — UI

El usuario no recibe **nada** por sonido: todo lo que otro producto diría con un «ding» lo dice la
pantalla. Tres reglas que no se negocian:

1. **Nada de color decorativo.** Todo color no neutro significa algo (diccionario abajo).
2. **Codificación triple.** Ningún estado solo con color: siempre color + ícono + texto.
3. **Cero audio.** Nunca `<audio>`, nunca video sin subtítulos.

**Stack:** Tailwind v4 (config en CSS, sin `tailwind.config.js`) · shadcn sobre **Base UI**
(`base-nova`, prop `render`, **no** `asChild`) · `lucide-react` · CVA + `cn()` · React Query para
datos de servidor · Zustand solo UI/sesión.

## Color

| Token               | Significa                                       | Nunca para          |
| ------------------- | ----------------------------------------------- | ------------------- |
| `primary`           | Acción principal, lo tuyo                       | Decoración          |
| `attention` (ámbar) | **Tiempo**: urgencia, ventana, escasez de cupos | Marca, adorno       |
| `success`           | Confirmado, disponible, completado              | —                   |
| `destructive`       | Pérdida o error                                 | —                   |
| `info`              | Contexto neutro, ayuda                          | —                   |
| `muted`             | Inactivo, pasado, sin acción                    | —                   |
| `--brand`           | Identidad: barras del shell, panel de acceso    | Contenido, acciones |
| `--accent-*`        | Categórico sin estado (etiquetas de filtros)    | Badges de estado    |

Cero colores literales en `.tsx`. Contraste: texto ≥ 7:1 cuando se pueda, mínimo 4.5:1; bordes con
significado ≥ 3:1. Los valores viven en `apps/web/src/index.css`. **Temas: claro y oscuro** (`.hc` está retirado del producto; sus
restos en CSS no se mantienen ni se verifican).

## Tipografía y forma

- Cuerpo **17px** · párrafos `max-w-[65ch]` · jerarquía por peso y tamaño, nunca por color · sin
  `text-justify` · `uppercase` solo en etiquetas de una palabra · pesos ≥ 400.
- Texto en inglés dentro de `<Ingles>` (`lang="en"`).
- `font-serif` solo en: acentos de la landing, el `<h1>` de `<PaginaCabecera>`, y titulares de
  `<EstadoVacio>` y `<AlertDialogTitle>`. Todo lo demás, Geist.
- Escala 4/8 · radios `rounded-lg` controles, `rounded-xl` tarjetas, `rounded-full` chips.
- Elevación por **borde**; `<Card>`, `<Table>` y botón sólido con `shadow-xs`; `shadow-lg` solo en
  lo que flota. Táctiles ≥ 44px (48px en primarias y móvil).

## Movimiento

Curva `--ease-suave`, duraciones `--duracion-rapida|normal|lenta`. Interacción: `transicion-rapida`
(lo que se toca) y `transicion-suave` (lo que se lee), no `transition-*` sueltos. Entradas:
`subir-suave`, `entra-escalonada`, `aparece`, `riel-entra`, `revelar`. `alerta-visual` es el
reemplazo del «ding»: una vez, en la transición real a un estado urgente. Prohibido: animación
infinita, parallax, transición de ruta, animar el `<h1>` que recibe foco. El movimiento nunca es la
única señal; `prefers-reduced-motion` ya está cubierto en `index.css`.

## Accesibilidad

Foco visible siempre (anillo 3px + offset 2px) · `<button>` para acciones, `<a>` para navegar · un
`<h1>` por página · `<label>` visible siempre; error junto al campo con `aria-invalid` +
`aria-describedby` + ícono · cambios dinámicos con `aria-live` · 4 estados: cargando, vacío, error,
éxito.

## Dónde está el detalle

Solo si la tarea entra en ese terreno:

- `layout-y-composicion.md` — shell, navegación por rol, rejilla 1/2/3, anatomía de página y
  tarjeta, regla del sólido.
- `patrones-dominio.md` — `<EstadoAula>` (9 estados), riel de estado, `<VentanaDeAcceso>`,
  `<IndicadorCupo>`, confirmaciones.
- `voz-microcopy.md` — antes de escribir copy nuevo. Español neutro, literal, voz activa, errores
  que explican.

## Prohibido

Sonido como señal · placeholder como única etiqueta · texto sobre imagen o degradado · ámbar
decorativo · modales anidados · deshabilitar sin explicar por qué · mutaciones optimistas en
reservas · porcentajes o gráficas circulares para cupos.

## Excepciones registradas (solo `features/panel/`, tarjetas de resumen)

- **D39** — ámbar solo en «Asistencia sin marcar» y «Profesores pendientes», con cifra > 0.
- **D40** — borde + `shadow-sm`, `shadow-md` al hover si la tarjeta entera es enlazable.
- **D41** — velo tenue del tono `*-soft` detrás; el texto nunca encima, contraste ≥ 4.5:1.
