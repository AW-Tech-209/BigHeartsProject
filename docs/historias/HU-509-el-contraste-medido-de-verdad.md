# HU-509 — El contraste, medido de verdad

| Campo               | Valor                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Auditoría                                        |
| **Prioridad**       | 🟡 Media (barata, y responde a una pregunta directa del socio) |
| **Estimación**      | 0.5 días                                                       |
| **Estado**          | ⬜ Pendiente                                                   |
| **Asignada a**      | **Dev A** — infraestructura                                    |
| **Rama**            | `hu-509-el-contraste-medido-de-verdad-a`                       |
| **Alcance técnico** | infra · documentación                                          |
| **Depende de**      | ninguna                                                        |
| **Labels**          | `post-fase-1` `prioridad:media` `infra` `a11y`                 |

> **Como** equipo que afirma cumplir AAA,
> **Quiero** poder demostrarlo con una medición y no con una promesa,
> **Para** que la próxima auditoría no tenga que escribir «no determinable».

## Contexto

Hallazgo #7 del socio: «contraste de color no medible con precisión a partir de capturas
estáticas», y su recomendación es medir con una herramienta sobre el sitio en vivo.

Tiene razón en el método. Nuestros tokens **se diseñaron** con ratios AAA y así está escrito en
`tokens.css`, pero **nadie ha pasado nunca un medidor** sobre la web desplegada. Que el valor
calculado sea correcto y que la pantalla lo muestre son dos afirmaciones distintas, y solo tenemos
la primera.

`axe` en los tests tampoco lo cubre: **jsdom no aplica las hojas de estilo de Tailwind**, así que
las reglas de contraste están desactivadas a propósito en `src/test/accesibilidad.ts`. Es decir:
la única comprobación automática que tenemos es precisamente la que no puede ver esto.

**Esta HU cierra el agujero y lo deja cerrado**, que es lo que la diferencia de medir una vez y
mandar un PDF.

## Dependencias técnicas

- **Reglas:** `bighearts-ui` → `SKILL.md` (texto ≥ 7:1 AAA cuando sea posible, mínimo 4.5:1; bordes
  y gráficos con significado ≥ 3:1).
- **Archivos:** `.github/workflows/`, un script nuevo, y `docs/`. **Cero archivos de `apps/web`
  salvo que la medición encuentre un fallo real.**
- **No colisiona con nadie:** Dev B no toca el workflow ni `docs/` en sus HUs.
- **Decisiones pendientes:** ninguna.

> **Si la medición encuentra un fallo de contraste, se corrige aquí.** Es el único caso en que esta
> HU toca `index.css`, y entonces hay que avisar a Dev B: un token que cambia se ve en todas las
> pantallas.

## 🔧 Tasks

### Infraestructura

- [ ] **T1** — Medición automática de contraste sobre la web **construida y servida**, no sobre
      jsdom. Recorre las pantallas públicas y las privadas con un usuario del seed.
- [ ] **T2** — Medir en **los dos temas**, claro y oscuro. El oscuro nunca se ha medido y es donde
      más fácil se cuela un fallo.
- [ ] **T3** — Umbrales según el skill: **7:1 para texto**, 4.5:1 como mínimo justificado, 3:1 en
      bordes y gráficos con significado.
- [ ] **T4** — Añadirlo al **CI**, en el job de frontend. Que falle si alguien mete un token que no
      cumple. Una medición que no bloquea se pudre en tres sprints.
- [ ] **T5** — Corregir lo que salga. Si algún token falla, se ajusta **respetando su significado**:
      el ámbar sigue siendo tiempo aunque cambie de luminosidad.

### Documentación

- [ ] **T6** — Guardar el **informe de la primera medición** en `docs/`, con fecha, y anotar en el
      skill que el contraste ahora se comprueba en CI. Ese informe es lo que se le manda al socio.

## ✅ Criterios de aceptación

- [ ] **AC1** — La medición corre sobre la web servida de verdad, **en claro y en oscuro**, y cubre
      las pantallas de los tres roles.
- [ ] **AC2** — El CI **falla** si un texto baja de 4.5:1 o un borde con significado de 3:1.
      Verificado rompiendo un token a propósito y viendo el CI en rojo.
- [ ] **AC3** — La medición actual pasa, o cada excepción queda anotada con su justificación.
- [ ] **AC4** — Si algún token se ajustó, **su significado no cambió**: el diccionario de color
      sigue diciendo lo mismo.
- [ ] **AC5** — El informe está en `docs/` con fecha, en un formato que se pueda enviar.
- [ ] **AC6** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde, y el CI
      no se alarga más de un minuto.

## 🚫 Fuera de alcance

- **Auditoría WCAG completa.** Esto mide contraste, no las demás pautas.
- **Rediseñar la paleta.** Se corrige lo que falle, no se replantea.
- **Medir dentro de Zoom o Meet.** No es nuestra interfaz.
- **Activar las reglas de contraste de `axe` en jsdom.** No funcionan ahí; ese es el motivo de esta
  HU.

## Notas de implementación

_Se rellena al cerrar._
