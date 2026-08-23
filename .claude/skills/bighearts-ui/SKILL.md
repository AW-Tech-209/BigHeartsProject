---
name: bighearts-ui
description: Convenciones de UI/UX, color, tipografía, accesibilidad y patrones de componentes para BigHearts (academia de inglés para personas hipoacúsicas y sordomudas). Úsalo siempre que se cree, edite o revise cualquier componente, pantalla, estilo Tailwind, formulario, estado de aula/reserva/cupo, o copy de la interfaz. Dispara con: componente, pantalla, UI, estilo, color, tarjeta, botón, formulario, accesibilidad, contraste, tema claro/oscuro, Tailwind, shadcn.
license: Proprietary
---

# BigHearts — UI/UX

Academia de inglés **para personas hipoacúsicas y sordomudas**. La videollamada ocurre fuera
(Zoom/Meet); esta plataforma gestiona acceso, cupos, reservas, recordatorios e historial.

> **Prueba definitiva del producto:** si un estudiante sordo entra, encuentra su clase, reserva
> y llega a la videollamada sin pedirle ayuda a nadie, el diseño funcionó. Ante la duda entre dos
> opciones, esa es la pregunta que decide.

## Por qué el diseño es así (léelo antes de improvisar)

En una interfaz para usuarios oyentes el color decora y el audio avisa. Aquí el usuario no recibe
**nada** por sonido, así que todo lo que un producto normal delegaría a un "ding" lo tiene que
decir la pantalla. Esto se traduce en 3 reglas que no se negocian:

1. **Nada de color decorativo.** Todo color no neutro significa algo (ver diccionario abajo).
2. **Codificación triple.** Ningún estado se comunica solo con color: siempre color + ícono + texto.
3. **Cero dependencia del audio.** Nunca `<audio>`, nunca "escucha el aviso", nunca video sin subtítulos.

## Stack (no negociable)

Tailwind v4 (config en CSS, sin `tailwind.config.js`) · shadcn sobre **Base UI** (`style: "base-nova"`,
usa prop `render`, **no** `asChild`) · `lucide-react` · CVA para variantes · `cn()` (clsx + tailwind-merge)
· React Query para estado de servidor (aulas, cupos, reservas) · Zustand solo para UI/preferencias
· `@fontsource-variable/geist`.

## Color — diccionario de significado

| Token               | Significa                                                | Nunca usar para        |
| ------------------- | -------------------------------------------------------- | ---------------------- |
| `primary`           | Acción principal, lo tuyo                                | Decoración             |
| `attention` (ámbar) | **Tiempo**: urgencia, ventana temporal, escasez de cupos | Marca, headers, adorno |
| `success`           | Confirmado, disponible, completado                       | —                      |
| `destructive`       | Pérdida o error                                          | —                      |
| `info`              | Contexto neutro, ayuda                                   | —                      |
| `muted`             | Inactivo, pasado, sin acción posible                     | —                      |

Todos los tokens (hex/oklch, modo claro, oscuro y alto contraste, ya verificados en contraste WCAG)
están en `tokens.css` de este skill. **No lo abras para escribir un componente**: el diccionario de
arriba ya te dice qué token usar, y `tokens.css` es el archivo más pesado de este skill. Ábrelo
**solo si vas a editar `apps/web/src/index.css`**, que es donde viven de verdad.

Cero colores literales en `.tsx` (`bg-primary`, nunca `#054DAE` ni `blue-600`).

Reglas de contraste: texto ≥ 7:1 (AAA) cuando sea posible, mínimo 4.5:1. Bordes/gráficos con
significado ≥ 3:1.

## Tipografía

Cuerpo base **17px** (no 16 — se lee español como puente al inglés). `text-justify` prohibido.
Ancho máximo de párrafo `max-w-[65ch]`. Jerarquía por peso y tamaño, nunca por color. Nunca
`uppercase` en frases (solo en etiquetas de una palabra). Todo texto en inglés envuelto en un
componente `<Ingles>` con `lang="en"` — es una academia de inglés, el contenido enseñado necesita
esa marca semántica para lectores de pantalla y correctores.

## Espaciado y forma

Escala de 4/8. Radios `rounded-lg` (controles), `rounded-xl` (tarjetas), `rounded-full` (chips/avatares).
Elevación por **borde antes que sombra** (`border border-border`); sombra solo en capas flotantes.
Objetivos táctiles ≥ 44px, 48px en acciones primarias y en móvil.

## Accesibilidad — no negociable en cada componente

- Foco visible siempre: anillo 3px + 2px de offset. **Jamás** `outline: none` sin reemplazo.
- `<button>` para acciones, `<a>` para navegación. Nunca `<div onClick>`.
- Un solo `<h1>` por página; al navegar, mover el foco al `<h1>` (`tabIndex={-1}`).
- Formularios: `<label>` visible siempre (placeholder no sustituye label), error junto al campo
  con `aria-invalid` + `aria-describedby` + ícono, nunca solo borde rojo.
- Cambios dinámicos (cupos, confirmaciones) → `aria-live="polite"`; errores bloqueantes → `assertive`.
- Respeta `prefers-reduced-motion` y la preferencia de movimiento guardada en el perfil del usuario.
- Todo componente necesita sus 4 estados: cargando, vacío, error, éxito. No se da por terminado sin ellos.

## Layout y composición

`SKILL.md` da las restricciones; **`layout-y-composicion.md` de este skill dice cómo se ve una
página**. Léelo antes de montar cualquier pantalla, shell o rejilla. Contiene: el ancla visual
(The Art Center — qué se roba y qué no), la navegación superior por rol, el contenedor y la rejilla
de 1/2/3 columnas, la anatomía de página y de tarjeta con sus valores, el ritmo vertical, **la
regla del sólido** (solo `acceso-abierto` y `en-curso` van en color pleno) y el estilo de
ilustración.

## Patrones del dominio — dónde buscar cada uno

Antes de reinventar cualquiera de estos, lee `patrones-dominio.md` de este skill:

- **`<EstadoAula>`** — el diccionario completo de 9 estados (disponible, últimos cupos, llena,
  reservada, acceso abierto, en curso, finalizada, cancelada, pendiente) con su color/ícono/texto exactos.
- **El riel de estado** — franja de 4px en el borde izquierdo de cada tarjeta de aula; es la firma
  visual del producto, permite escanear una lista con visión periférica.
- **`<VentanaDeAcceso>`** — el componente de la regla de negocio central (enlace se revela 30 min
  antes), con sus 5 fases y la animación `alerta-visual` (el reemplazo accesible de un "ding").
- **`<IndicadorCupo>`** — conteo literal, nunca porcentajes ni gráficas circulares.
- Acciones destructivas (cancelar reserva/aula) — siempre `AlertDialog` con verbos, nunca Sí/No.

## Voz y microcopy

Antes de escribir copy nuevo (botones, errores, vacíos, toasts) lee `voz-microcopy.md` de este skill.
Resumen: español neutro, literal (nunca figurado — muchos usuarios tienen la lengua de señas como
primer idioma), voz activa, mismo verbo en todo el flujo, los errores explican y no se disculpan.

## Prohibido siempre

Sonido como señal · video sin subtítulos/autoplay · placeholder como única etiqueta · texto sobre
imagen/gradiente · ámbar decorativo · `text-justify` · modales anidados · deshabilitar sin explicar
por qué · pesos tipográficos < 400 · mutaciones optimistas en reservas (el cupo tiene concurrencia
real; no se muestra "reservado" antes de que el servidor confirme).

## Checklist antes de dar un componente por terminado

Teclado completo con foco visible · cada estado legible sin color · contraste ≥ 7:1 (o ≥4.5:1
justificado) · objetivos táctiles ≥ 44px · funciona en `.dark` y `.hc` · respeta reduced-motion ·
4 estados (cargando/vacío/error/éxito) · cero color literal · zoom 200% sin romperse · cambios
dinámicos anunciados por `aria-live`.
