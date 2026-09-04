# HU-503 — Las tarjetas del panel, con oficio

| Campo               | Valor                                              |
| ------------------- | -------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Pulido                               |
| **Prioridad**       | 🟠 Alta (es la primera pantalla que ve el cliente) |
| **Estimación**      | 1.5 días                                           |
| **Estado**          | ⬜ Pendiente                                       |
| **Rama**            | `hu-503-tarjetas-de-panel-con-oficio-<persona>`    |
| **Alcance técnico** | frontend                                           |
| **Depende de**      | HU-502 (✅)                                        |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend` `a11y`   |

> **Como** persona que abre BigHearts,
> **Quiero** que el panel se vea cuidado desde el primer vistazo,
> **Para** confiar en la plataforma antes de haber leído una sola cifra.

## Contexto

HU-502 acertó **qué** dicen las tarjetas. Esta HU arregla **cómo se ven**.

Hoy `<TarjetaResumen>` es `rounded-xl border p-4 pl-5`, un título en `text-sm` con un ícono pegado
al lado, un número y un enlace subrayado. Funciona, es accesible y es honesto — pero es un recuadro
con texto dentro, y el panel es lo primero que el cliente ve de la plataforma.

### De dónde sale aquí la sensación de «premium»

**No de la decoración, y no es una limitación: es la vía correcta.** Este producto prohíbe el color
decorativo por una razón que no se negocia —todo color no neutro significa algo, porque el usuario
no recibe nada por sonido—. Un panel lleno de degradados de marca sería más vistoso y **peor**.

La buena noticia es que lo que de verdad se lee como premium en un panel no es el adorno: es la
**escala tipográfica**, el **aire**, la **alineación** y el **acabado de los detalles**. Es de donde
sacan su calidad los paneles que se sienten caros. Y en este producto esa vía además refuerza el
diseño en vez de pelearse con él: un número enorme y tabular se lee de un vistazo, que es
exactamente lo que la tarjeta existe para conseguir.

### Dos reglas del skill que esta HU relaja

**Aprobadas por William al planificar la HU (2026-08-27).** Las dos modifican `bighearts-ui`, y esta
HU es la que lo escribe allí — el skill no puede quedar diciendo lo contrario de lo que hace el
código.

Las dos son **acotadas a las tarjetas de resumen del panel**. No abren la puerta a sombras ni velos
de color en el resto del producto: las tarjetas de aula, los formularios y los listados siguen con
la regla original.

| #       | Regla actual                                                            | Lo que se propone                                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **D40** | «Elevación por borde antes que sombra; sombra solo en capas flotantes.» | Las tarjetas de resumen del panel llevan **borde + sombra sutil**, y una algo mayor al pasar el cursor si son enlazables. Solo esta superficie: las tarjetas de aula no cambian.                 |
| **D41** | «Prohibido texto sobre imagen o degradado.»                             | Se permite un **velo de color muy tenue** detrás de la tarjeta, saliendo de la esquina del ícono. **El texto nunca cae encima**: se sitúa sobre la zona plana, y el contraste se verifica igual. |

## Dependencias técnicas

- **Reglas:** `bighearts-ui` → `SKILL.md` (diccionario de color, tipografía, espaciado y forma),
  `layout-y-composicion.md` (el riel de estado, la rejilla de 3), **D39** de HU-502 (dónde puede
  aparecer el ámbar).
- **Archivos:** `features/panel/components/tarjeta-resumen.tsx` y sus consumidores, más
  `bighearts-ui` → `SKILL.md` (D40 y D41).
- **Decisiones pendientes:** ninguna. **D40 y D41 quedan aprobadas**; esta HU las escribe.

> **Lo que no se toca.** Ni los datos, ni el endpoint, ni qué dice cada tarjeta, ni el contenido que
> va debajo en el panel. Es una HU de presentación: si al terminar cambió una cifra, se hizo mal.

## 🔧 Tasks

### Frontend

- [ ] **T1** — **Anatomía en tres zonas** dentro de `<TarjetaResumen>`: cabecera (ícono + etiqueta),
      cuerpo (la cifra) y pie (la acción, separada por un filete `border-t`). Hoy es un
      `flex-col gap-2` sin estructura. Más aire: de `p-4` a `p-5`/`p-6`.
- [ ] **T2** — **La cifra manda.** Escala grande (44–52 px), peso 600, `tabular-nums` y
      `tracking-tight`, con la unidad o el contexto en `muted-foreground` **a su lado**, no debajo.
      Ese contraste de escala es la mayor parte del efecto.
- [ ] **T3** — **El ícono en contenedor**: cuadrado de ~40 px con `rounded-lg` y fondo del tono
      suave que corresponda, en vez de un ícono suelto junto al título.
- [ ] **T4** — **El riel de estado sube al panel**: franja de 4 px a la izquierda con el color del
      tono, como en las tarjetas de aula. Es la firma visual del producto y hoy el panel no la usa.
- [ ] **T5** — **Altura uniforme** en la fila: las tres tarjetas se alinean aunque una tenga una
      línea más. El pie queda pegado abajo en todas.
- [ ] **T6** — **Interacción:** donde la tarjeta lleva a un solo destino, es **clicable entera** —no
      solo el enlace del pie—, con hover que la eleva y foco visible sobre toda ella. Entrada
      escalonada suave, anulada bajo `prefers-reduced-motion`.
- [ ] **T7** — Tests de lo que no se puede romper (tono correcto por tarjeta, la tarjeta enlazable
      es un solo destino accesible, `axe` limpio).

### Documentación

- [ ] **T8** — Escribir **D40 y D41** en `bighearts-ui` → `SKILL.md`, **dejando claro que solo
      aplican a las tarjetas de resumen del panel**, y registrarlas en el registro de decisiones.
      Sin esto, el skill sigue prohibiendo lo que el código acaba de hacer.

## ✅ Criterios de aceptación

- [ ] **AC1** — La cifra es **al menos 2,5 veces** el tamaño de la etiqueta, va en `tabular-nums` y
      no baila al cambiar de valor.
- [ ] **AC2** — Las tres tarjetas de cada panel tienen **la misma altura** y sus pies quedan
      alineados, sea cual sea el contenido.
- [ ] **AC3** — Una tarjeta con destino único se activa **haciendo clic en cualquier punto** y con
      teclado, con un solo elemento enfocable y el foco visible rodeando la tarjeta entera.
- [ ] **AC4** — **El color sigue significando lo mismo:** no aparece ningún tono fuera del
      diccionario, y el ámbar solo en las dos tarjetas que D39 permite.
- [ ] **AC5** — Con `prefers-reduced-motion` **no hay movimiento**, y todo texto mantiene contraste
      ≥ 4,5:1 —incluido el que quede sobre el velo de color, si se aprueba D41—.
- [ ] **AC6** — **Ni un dato cambió** respecto a HU-502, `axe` limpio, y `typecheck`, `lint`,
      `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Cambiar qué dicen las tarjetas** o de dónde salen los datos. Eso es HU-502 y está cerrada.
- **Gráficas, porcentajes o barras de progreso.** La regla del conteo literal no se toca: la cifra
  se hace grande, no se convierte en dibujo.
- **Mayúsculas en las etiquetas.** «Profesores pendientes de aprobar» no es una palabra suelta, y el
  skill solo las permite ahí. Es la tentación más habitual al estilizar una tarjeta de panel.
- **Rediseñar el resto del panel** ni las tarjetas de aula. Solo la fila de resumen.
- **Ilustraciones o imágenes** dentro de las tarjetas.

## Notas de implementación

_Se rellena al cerrar._
