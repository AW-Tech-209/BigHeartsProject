# Layout y composición — BigHearts

Lo que el resto del skill no dice: **cómo se ve una página**. `SKILL.md` da el sistema de
restricciones —qué está prohibido, qué exige la accesibilidad, qué significa cada color—. Las
restricciones impiden lo feo; no producen lo bonito. Esto es lo segundo.

## El ancla

La referencia visual es **The Art Center** (theartcenter.nyc): confianza tipográfica, generosidad
de espacio, tarjetas de programa grandes y legibles.

**Lo que se roba:** el peso del titular, el aire entre secciones, el radio amplio en tarjeta, la
sensación de que cada bloque respira.

**Lo que NO se roba:** su ritmo. Es un sitio de marketing — héroe enorme, una acción por sección,
scroll narrativo. BigHearts es una herramienta que el estudiante abre cada semana. Un héroe que
enamora la primera vez cansa a la décima.

**La calidez sale del layout y la tipografía, no del color.** La paleta se queda como está: sus
contrastes ya están verificados en claro, oscuro y alto contraste, y el ámbar está reservado a
tiempo. Si algo se siente frío, la respuesta es más espacio o más peso, nunca otro tono.

## El shell

**Navegación superior. Nunca lateral.** Hay entre 3 y 4 destinos por rol; una barra lateral para
cuatro enlaces es una columna de espacio muerto, y la rejilla de aulas es justo lo que agradece el
ancho.

| Rol       | Destinos                    |
| --------- | --------------------------- |
| `STUDENT` | Aulas · Mis clases · Perfil |
| `TEACHER` | Aulas · Mis aulas · Perfil  |
| `ADMIN`   | Aulas · Panel · Perfil      |

- Barra de **58px**, `bg-card`, borde inferior `border-border`. Marca a la izquierda en
  `text-primary`, peso 500. Avatar de 30px a la derecha.
- Enlaces en `text-sm`. El activo lleva **borde inferior de 2px en `border-primary`** — no solo un
  cambio de color, porque el color solo no sobrevive al alto contraste.
- **Prohibida la hamburguesa en escritorio.** Los cuatro destinos se ven siempre.
- **En móvil (< 640px), barra inferior fija** con ícono **+ texto**, nunca ícono solo. No cajón, no
  toggle: un cajón añade un estado que aprender, y para quien lee español como segunda lengua eso
  cuesta más que a ti. _Decisión de esta guía; no venía de ninguna referencia._
- El `<SkipLink>` ya existe y vive en el shell, antes de la barra.
- El contenido va en un `<main>` con `id` al que apunta el skip-link.

## Contenedor y rejilla

- Contenedor: `mx-auto max-w-6xl px-6` (1152px). En móvil `px-4`.
- Rejilla de tarjetas: **1 columna** < 640px · **2** ≥ 640px · **3** ≥ 1024px. `gap-3`.
- **Nunca 4 columnas.** A partir de ahí el título de aula parte en tres líneas y la tarjeta deja de
  escanearse.

## Anatomía de página

Toda pantalla se compone igual, en este orden:

1. **Cabecera** — `<h1>` en `text-3xl` (34px), `tracking-tight`, peso 500. En móvil `text-2xl`.
   Debajo, una línea de contexto en `text-base` (17px), `text-muted-foreground`, `max-w-[46ch]`.
   A la derecha, la acción principal si la hay.
2. **Controles** — filtros, búsqueda, conmutadores. Persistentes, nunca dentro de un desplegable.
   Separados de la cabecera por una regla `border-b border-border`.
3. **Contenido** — la rejilla, la lista o el formulario.

**Un solo `<h1>` por página**, y es el título de la cabecera. `usePageTitle` mueve el foco ahí en
cada cambio de ruta; úsalo, no lo reimplementes.

**Ritmo vertical:** 32px entre bloques mayores (`space-y-8`), 16px dentro de un bloque. La cabecera
lleva 30px de aire por arriba. No inventes valores intermedios.

## Anatomía de tarjeta

```
┌─┬──────────────────────────────┐
│ │ Mar 25 · 6:00 p. m.          │  ← 12px, muted
│▌│ Conversación cotidiana       │  ← 16px/500, es el <h3>
│ │ Ana Restrepo · Intermedio    │  ← 13px, muted
│ │ [◉ Quedan 5 cupos]           │  ← <EstadoAula>
└─┴──────────────────────────────┘
 ↑ riel de 4px
```

- `rounded-xl border border-border bg-card p-4 pl-5 relative overflow-hidden`.
- El **riel** es `absolute inset-y-0 left-0 w-1` con el color del estado. Sin radio propio: un borde
  de un solo lado con esquinas redondeadas se ve roto.
- La tarjeta es un `<article>` con `aria-labelledby` apuntando al `<h3>` del título. El nombre
  accesible de la tarjeta es el título, no la fecha.
- La fecha va **antes** del título en el DOM a propósito: el lector de pantalla anuncia cuándo es
  la clase antes de cómo se llama, que es el orden en que decide el estudiante.

## Jerarquía de estados — la regla del sólido

De los nueve estados de `<EstadoAula>` (ver `patrones-dominio.md`), **solo dos van en color
sólido**:

| Sólido                                        | Suave           |
| --------------------------------------------- | --------------- |
| `acceso-abierto` (ámbar) · `en-curso` (verde) | los otros siete |

El sólido está reservado a **"hay algo que hacer ahora mismo"**. Es lo más ruidoso de la pantalla
y debe serlo: `acceso-abierto` es el instante en que el producto cumple su promesa.

**No subas otro estado a sólido para destacarlo.** En el momento en que hay dos cosas gritando,
ninguna grita. Si en una lista aparecen varios sólidos a la vez, es correcto: significa que hay
varias clases abiertas.

## Tarjeta o fila

- **Tarjeta** cuando el usuario **escanea para elegir**: listado de aulas, resultados de búsqueda.
- **Fila** cuando **escanea para administrar** y hay más de ~15 elementos: profesores pendientes,
  inscritos de una clase, historial largo.

La fila conserva el riel de 4px. No conserva el radio.

## Ilustración

Solo en **estados vacíos y onboarding**. Nunca en tarjetas de aula ni junto a datos.

- **Geométrica**, construida con los primitivos del propio producto: rectángulos de tarjeta con su
  riel. Es el producto explicándose a sí mismo, no un dibujo decorativo.
- Solo tokens. Cero degradados, cero sombras, cero hex literal. Tiene que sobrevivir a `.dark` y
  a `.hc`.
- `role="img"` + `aria-label` que describa qué representa.
- **Nunca lleva información que no esté también en el texto.** Es refuerzo, no contenido.

Estado vacío completo: ilustración → titular en `text-xl` → una línea de ayuda en `text-base`
`text-muted-foreground` `max-w-[38ch]` → botón con verbo. El microcopy sale de `voz-microcopy.md`:
invita a actuar, nunca "Sin resultados".

## Prohibido en layout

Barra lateral · hamburguesa en escritorio · más de 3 columnas de tarjeta · filtros escondidos en un
desplegable · dos acciones primarias en la misma pantalla · un estado sólido que no sea
`acceso-abierto` o `en-curso` · más de un `<h1>` · valores de espaciado fuera de 16/32 ·
ilustración con información que no esté en el texto.
