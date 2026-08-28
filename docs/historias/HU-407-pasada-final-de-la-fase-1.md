# HU-407 — Pasada final de la Fase 1

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Sprint 4 — Notificaciones e Historial            |
| **Prioridad**       | 🔴 Crítica (es la puerta de salida de la Fase 1) |
| **Estimación**      | 1 día                                            |
| **Estado**          | ⬜ Pendiente                                     |
| **Rama**            | `hu-407-pasada-final-de-la-fase-1-<persona>`     |
| **Alcance técnico** | frontend · QA                                    |
| **Depende de**      | HU-406 (hacen falta datos para recorrerlo todo)  |
| **Labels**          | `sprint-4` `prioridad:critica` `a11y` `qa`       |

> **Como** equipo,
> **Quiero** recorrer la Fase 1 entera como la recorrería un estudiante sordo,
> **Para** entregar sabiendo que funciona, no suponiéndolo.

## Contexto

HU-215 hizo esto para el Sprint 2 y encontró que `.dark` y `.hc` eran **CSS muerto**: los temas
estaban definidos y nada los aplicaba. Ese hallazgo no salió de ningún test —`axe` no lo ve—, salió
de abrir un navegador. Los Sprints 3 y 4 no han tenido su pasada, y traen las pantallas donde más
se juega el producto: reservar, entrar a la clase y consultar el historial.

Esta es **la última puerta antes de entregar**, y por eso no es la de HU-215 repetida. Aquella
verificaba pantallas sueltas; esta verifica **el recorrido completo**, que es lo que mide §8.1:

> _Si un estudiante sordo entra a la plataforma, encuentra su clase, reserva y llega a la
> videollamada sin pedirle ayuda a nadie, el producto funcionó._

**Se recorre entero, de una sentada, sin ratón y sin ayuda.** Si en algún punto hay que adivinar
qué hacer, eso es el hallazgo.

### Lo que esta pasada mira y ninguna otra cosa mira

- El recorrido **completo** del estudiante, sin saltarse pasos ni usar URLs directas.
- Los **correos** de HU-401 y HU-402: cómo se leen de verdad en un cliente real, en texto plano, en
  el móvil. Es la única superficie del producto que no controlamos.
- `.dark` y `.hc` en las pantallas de los Sprints 3 y 4, que nunca se han mirado.
- Que ninguna pantalla **prometa** algo que el producto no hace — el fallo que originó HU-209 y que
  reapareció en HU-309.

## Dependencias técnicas

- **Reglas:** `DEFINICION_PROYECTO.md` §8 y §8.1 (los criterios de éxito).
- **Skills:** `bighearts-ui` → el checklist del final de `SKILL.md`.
- **Necesita HU-406**: sin historial sembrado no hay nada que recorrer en la última pantalla.
- Se recorre con `docker compose up` y los usuarios del seed, uno por rol.

## 🔧 Tasks

### QA

- [ ] **T1** — **El recorrido del estudiante, entero y solo con teclado:** entrar, encontrar una
      clase que le sirva por su modo de comunicación, reservarla, verla en su panel, esperar la
      ventana y llegar al enlace. Sin ratón, sin URLs directas, sin ayuda.
- [ ] **T2** — **El recorrido del profesor:** crear un aula, ver quién viene con sus modos de
      comunicación, marcar asistencia al terminar y consultarlo en el historial.
- [ ] **T3** — **Los correos.** Provocar los siete y abrirlos en un cliente real: los cinco de
      HU-401 y los dos recordatorios. Comprobar que se entienden **en texto plano** y en pantalla
      de móvil, con la hora y su zona.
- [ ] **T4** — Recorrer las pantallas de los Sprints 3 y 4 en `.dark` y en `.hc`. Nunca se han
      mirado.
- [ ] **T5** — Buscar **promesas falsas**: cualquier pantalla que anuncie algo que el producto no
      hace, o que muestre un vacío donde hay datos. Es el fallo que ya volvió dos veces.
- [ ] **T6** — Abrir un **bug por cada hallazgo**, con la pantalla y el paso exacto. Los que
      bloqueen el recorrido son de corrección obligada antes de entregar.

## ✅ Criterios de aceptación

- [ ] **AC1** — El recorrido completo del estudiante —entrar, encontrar, reservar, llegar al
      enlace— se completa **solo con teclado y sin ayuda**. Si no, hay bug abierto que lo explica.
- [ ] **AC2** — El recorrido completo del profesor —crear, ver inscritos, marcar, consultar— se
      completa igual.
- [ ] **AC3** — Los **siete correos** se entienden en texto plano, sin depender de color ni de
      imágenes, con la hora y su zona explícita.
- [ ] **AC4** — En `.hc` se distinguen los nueve estados de aula, los tres resultados de asistencia
      y el destino activo de la navegación.
- [ ] **AC5** — **Ninguna pantalla promete lo que el producto no hace**, ni muestra un vacío
      teniendo datos.
- [ ] **AC6** — Cada hallazgo tiene su bug abierto, y **ninguno que bloquee el recorrido queda sin
      corregir**.

## 🚫 Fuera de alcance

- **Corregir** los bugs encontrados. Esta HU los abre; se arreglan en su propio ticket, para que el
  hallazgo quede trazado.
- **Pruebas con usuarios reales de la academia.** Es el criterio de éxito nº 1 de §8 y merece su
  propio momento, con personas de verdad — no un ticket de cierre de sprint. Sigue siendo el riesgo
  declarado en §8.2.
- **Auditoría WCAG formal** con herramienta externa.
- **El corte a producción.** El Sprint 4 termina en staging; `DEPLOYMENT.md` §producción lo aplaza
  explícitamente.

## Notas de implementación

_Se rellena al cerrar._
