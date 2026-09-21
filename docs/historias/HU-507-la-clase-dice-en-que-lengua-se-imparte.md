# HU-507 — La clase dice en qué lengua se imparte, y se ve que no es un tag más

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Auditoría                             |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 2 días                                              |
| **Estado**          | ⬜ Pendiente                                        |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-507-la-clase-dice-en-que-lengua-se-imparte-b`   |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | **HU-505 mergeada**                                 |
| **Labels**          | `post-fase-1` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante sordo que mira el catálogo,
> **Quiero** ver de un golpe en qué lengua se imparte cada clase,
> **Para** no tener que deducirlo de una fila de etiquetas todas iguales.

## Contexto

Esto es literalmente lo que el socio vio y anotó como hallazgo de severidad alta:

> «Lengua de signos» aparece como tag de «modo de comunicación» al mismo nivel que «Texto escrito» y
> «Lectura labial», sugiriendo trato como preferencia seleccionable y no como lengua de instrucción.

Y tenía razón **en la presentación**. El modelo de datos ya distinguía impartir en señas de tener
intérprete desde HU-211 —está escrito en su decisión 2— pero la interfaz los aplana en una fila de
chips indistinguibles. Lo que el usuario ve es lo que el producto dice.

**Esta HU no cambia datos ni endpoints.** HU-506 hace eso en paralelo. Aquí se pinta el modelo
nuevo que HU-505 ya publicó, y **se puede empezar sin esperar a A**: los tipos están en `main` y la
API se mockea, como en todos los tests de esta app.

### La jerarquía visual que hay que construir

| Nivel                       | Qué es                                                | Cómo se ve                                                                                                        |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **1 · Modo de instrucción** | `LSC_NATIVA` o `INTERPRETE_LSC`                       | **Destacado, siempre visible, nunca en una fila con los apoyos.** Es lo primero que el estudiante necesita saber. |
| **2 · Apoyos**              | Lectura labial, texto escrito, subtítulos, materiales | Chips secundarios, discretos, agrupados aparte y claramente subordinados.                                         |
| **3 · Sin declarar**        | Aulas anteriores a HU-506                             | Estado propio y honesto: «Modo de instrucción sin declarar». **No se disfraza de nada.**                          |

### Y el detalle que el socio citó sin comentarlo

La etiqueta dice **«Lengua de signos»** — término de España. Aquí es **Lengua de Señas Colombiana
(LSC)**, como la llama el framework del socio. HU-505 ya cambió la etiqueta en el contrato; esta HU
se asegura de que no quede ni una «lengua de signos» suelta en la interfaz.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.9 reescrita en HU-505 (D42–D45). **Regla 1 intacta: se destaca,
  no se filtra** — el catálogo sigue mostrando todas las clases y el estudiante puede reservar
  cualquiera.
- **Skills:** `bighearts-ui` → `patrones-dominio.md` (los chips y su color) y
  `layout-y-composicion.md` (anatomía de tarjeta).
- **Reutiliza:** la función de emparejamiento y las etiquetas, las dos de HU-505. `<EstadoAula>` no
  cambia: esto es otra dimensión, no un estado más.
- **Archivos:** solo `apps/web/src/features/aulas/`, `pages/` y `components/dominio/`. **Dev A no
  toca ninguno**, y `features/landing/` es de HU-510 — **no lo toques.**
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### Frontend

- [ ] **T1** — Componente de **modo de instrucción**, separado de los apoyos, con color + ícono +
      texto y sus tres casos: LSC nativa, con intérprete, y sin declarar.
- [ ] **T2** — Tarjeta del catálogo y detalle del aula: el modo de instrucción **arriba y
      destacado**; los apoyos en un grupo secundario, visualmente subordinado.
- [ ] **T3** — Formulario de crear y editar aula: el modo de instrucción es un campo **obligatorio y
      explicado** —una línea que diga por qué solo hay dos opciones—, y los apoyos van aparte.
- [ ] **T4** — El campo del enlace valida con `esProveedorPermitido()` **antes de enviar**, y el
      error dice qué plataformas se aceptan y por qué: subtítulos en vivo. Se retira el desplegable
      de proveedor, que ahora se deriva del enlace.
- [ ] **T5** — Un aula **sin modo declarado** se muestra como tal en catálogo, detalle y «mis
      aulas», y al profesor dueño se le ofrece completarlo.
- [ ] **T6** — Perfil y registro del estudiante: la preferencia se pregunta con el vocabulario nuevo.
      Barrer la interfaz hasta que **no quede ninguna «Lengua de signos»**.
- [ ] **T7** — Tests: el modo de instrucción se encuentra por rol y texto, separado de los apoyos;
      un enlace no permitido no deja enviar; el aula sin declarar se pinta como tal; `axe` limpio.

## ✅ Criterios de aceptación

- [ ] **AC1** — En catálogo y detalle, el **modo de instrucción se distingue de los apoyos** sin
      leer: posición, peso y agrupación distintos. No comparten fila.
- [ ] **AC2** — No aparece **«Lengua de signos»** en ninguna pantalla; dice **«Lengua de Señas
      Colombiana (LSC)»**. Verificado con una búsqueda en el código, no a ojo.
- [ ] **AC3** — El formulario **no deja crear un aula sin modo de instrucción**, ni con un enlace
      que no sea de Zoom, Meet o Teams, y el error explica el porqué.
- [ ] **AC4** — Un aula sin modo declarado se muestra con su propio estado, **sin inventarle uno**,
      y el profesor dueño ve cómo completarlo.
- [ ] **AC5** — **Se sigue destacando, no filtrando:** el catálogo muestra todas las clases y el
      estudiante puede reservar cualquiera, coincida o no con su preferencia.
- [ ] **AC6** — **Accesibilidad y verificación:** cada distinción se entiende sin color, teclado
      completo, `axe` limpio, y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Cualquier archivo de `apps/api`.** Es de Dev A en HU-506.
- **`features/landing/`.** Es de Dev A en HU-510. Tocarlo aquí provoca el único conflicto posible
  entre las dos ramas.
- **Filtrar el catálogo** por modo de instrucción. La regla 1 de §4.9 no se toca.
- **La pasada móvil**, que es HU-508 y va después.

## Notas de implementación

_Se rellena al cerrar._
