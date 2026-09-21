# HU-508 — La plataforma en el móvil, pantalla por pantalla

| Campo               | Valor                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · Auditoría                                                  |
| **Prioridad**       | 🟠 Alta                                                                  |
| **Estimación**      | 1.5 días                                                                 |
| **Estado**          | ⬜ Pendiente                                                             |
| **Asignada a**      | **Dev B** — frontend · va **después** de HU-507                          |
| **Rama**            | `hu-508-la-plataforma-en-el-movil-b`                                     |
| **Alcance técnico** | frontend · QA                                                            |
| **Depende de**      | HU-507 y HU-510 mergeadas (si no, se verifica material que va a cambiar) |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend` `a11y` `qa`                    |

> **Como** estudiante que entra desde el celular,
> **Quiero** que cada pantalla se use igual de bien que en el computador,
> **Para** no quedarme fuera por el aparato desde el que miro.

## Contexto

El socio lo pidió y no se lo mandamos: hallazgo #4, «falta vista móvil: se solicitó explícitamente
y no se recibió». La plataforma **es responsive** —rejilla de 1/2/3 columnas, barra inferior fija en
móvil con ícono y texto, objetivos táctiles de 48 px— y HU-215 comprobó los tres anchos. Pero eso
fue hace cuatro sprints y **solo sobre las pantallas de entonces**. Reservas, historial, panel,
asistencia y la landing entera llegaron después.

**Esta HU no es una revisión por encima: es un recorrido exhaustivo con lista cerrada.** Se cierra
cuando las quince pantallas están verificadas, no cuando parezca que va bien.

### Cómo se recorre

En un **teléfono de verdad** o, como mínimo, con el navegador emulando uno a 375 px de ancho — que
es donde se rompe lo que a 768 aguanta. Cada pantalla se abre, **se usa completa hasta terminar la
tarea**, y se anota.

**Las quince pantallas:** landing · registro · login · recuperar contraseña · panel (los tres roles
tienen bloques distintos, cuentan como tres pasadas) · catálogo con filtros · detalle de aula ·
crear aula · editar aula · mis aulas · mis clases · historial · inscritos y marcado de asistencia ·
supervisión del admin · perfil.

### Lo que rompe en móvil y no en escritorio

Es la lista de lo que hay que buscar a propósito, porque no salta solo:

- **Tablas** que no caben y provocan barrido horizontal de toda la página —supervisión, inscritos,
  historial son las candidatas—.
- **Formularios largos** donde el teclado del móvil tapa el campo activo o el botón de enviar.
- **Objetivos táctiles** por debajo de 48 px, y dos acciones tan juntas que se pulsa la que no era.
- **Texto que se corta o desborda** con títulos largos de aula, y las cifras grandes del panel
  (HU-503) a 375 px.
- **Diálogos de confirmación** que se salen de la pantalla o no dejan llegar al botón.
- **La barra inferior** tapando contenido o el último elemento de una lista.
- **Zoom al 200 %**, que es requisito de accesibilidad y en móvil es donde de verdad duele.

## Dependencias técnicas

- **Skills:** `bighearts-ui` → `layout-y-composicion.md` §1 (la barra inferior en móvil, sin
  drawers ni hamburguesa) y el checklist del final de `SKILL.md`.
- **Va después de HU-507 y HU-510**: verificar pantallas que están a punto de cambiar es trabajo
  tirado.
- **Archivos:** cualquiera de `apps/web`, pero **solo correcciones**. Si aparece algo que pide
  rediseño, se abre un ticket aparte y no se hace aquí.
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### QA y corrección

- [ ] **T1** — Recorrer las **quince pantallas** a 375 px completando la tarea de cada una, con la
      lista de arriba delante. Anotar cada hallazgo con pantalla y paso exacto.
- [ ] **T2** — Repetir los **tres recorridos completos** —estudiante reserva y llega al enlace;
      profesor crea, ve inscritos y marca; admin aprueba y supervisa— **enteros desde el móvil**. Es
      donde aparece lo que una pantalla suelta no enseña.
- [ ] **T3** — Corregir lo encontrado, **sin rediseñar**: ajustes de layout, táctiles, desbordes y
      scroll. Lo que pida rediseño se anota y se sale.
- [ ] **T4** — Tablas que no quepan: resolverlas con el patrón que ya existe —**fila que se
      convierte en tarjeta** por debajo de 640 px—, no con barrido horizontal.
- [ ] **T5** — Comprobar **zoom al 200 %** en las pantallas de tarea crítica: reservar, entrar a la
      clase y marcar asistencia.
- [ ] **T6** — Dejar en el repo la **lista de las quince con su veredicto**, dentro de las notas de
      esta HU. Es lo que permite cerrarla y lo que se le manda al socio.

## ✅ Criterios de aceptación

- [ ] **AC1** — Las **quince pantallas** están recorridas y anotadas. Ninguna queda sin veredicto.
- [ ] **AC2** — Los **tres recorridos completos** se terminan desde un móvil sin bloqueos.
- [ ] **AC3** — **Ninguna pantalla exige barrido horizontal** a 375 px, y ninguna tabla se sale.
- [ ] **AC4** — Todos los objetivos táctiles llegan a **48 px**, y ningún elemento queda tapado por
      la barra inferior ni por el teclado.
- [ ] **AC5** — A **zoom 200 %** se completan reservar, entrar a la clase y marcar asistencia.
- [ ] **AC6** — **Verificación:** `axe` limpio en lo tocado, y `typecheck`, `lint`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Rediseñar** ninguna pantalla. Se corrige lo que está roto en móvil, no se replantea.
- **Una app nativa.** No existe y no se promete.
- **Tablet.** Los 768 px ya los cubría HU-215; aquí interesa el teléfono.
- **Pantallas nuevas.**

## Notas de implementación

_Se rellena al cerrar, con la tabla de las quince pantallas y su veredicto._
