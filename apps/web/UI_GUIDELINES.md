# BigHearts — Convenciones de UI/UX

> **Este archivo ya no contiene las convenciones.** Son ahora un skill de Claude Code.

La fuente de verdad del diseño vive en **`.claude/skills/bighearts-ui/`**:

| Archivo               | Qué contiene                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `SKILL.md`            | Principios, stack de UI, diccionario de color, tipografía, accesibilidad y prohibiciones.              |
| `tokens.css`          | Todos los tokens de color en modo claro, oscuro y alto contraste, con sus contrastes WCAG verificados. |
| `patrones-dominio.md` | `<EstadoAula>`, el riel de estado, `<VentanaDeAcceso>`, `<IndicadorCupo>` y acciones destructivas.     |
| `voz-microcopy.md`    | Voz, microcopy, toasts y estados de carga.                                                             |

**No añadas `@UI_GUIDELINES.md` a `CLAUDE.md`.** El skill se carga solo cuando la tarea toca UI —
que es justo lo que hace falta. Cargarlo en cada sesión gastaba contexto en el 100 % de las
conversaciones para servir al 40 %.

## Por qué cambió

Este archivo y el skill eran **el mismo contenido duplicado**, y ya habían empezado a divergir: el
documento decía `style: "base-vega"` cuando `components.json` dice `base-nova`, y mandaba escribir
los tokens en `src/styles/globals.css`, una ruta que no existe — el archivo real es
`src/index.css`. Dos fuentes de verdad para lo mismo siempre acaban así.

Ver `docs/ARQUITECTURA.md` §14 para el registro completo de la auditoría.

## Recordatorios rápidos

Lo mínimo, por si llegaste aquí sin abrir el skill:

- El color **significa**, no decora. Todo estado se comunica con **color + ícono + texto**.
- **Cero dependencia del audio.** Nunca `<audio>` como señal, nunca video sin subtítulos.
- Cuerpo **17px**. Tokens siempre (`bg-primary`), nunca colores literales en `.tsx`.
- Tailwind v4 con el tema en **`src/index.css`**. No crear `tailwind.config.js`.
- Base UI usa la prop **`render`**, no `asChild`. No copies snippets de Radix sin adaptar.
- Todo componente necesita sus **4 estados**: cargando, vacío, error, éxito.
