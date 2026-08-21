# HU-209 — Panel de inicio por rol

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Sprint 2 — Gestión de Aulas                      |
| **Prioridad**       | 🔴 Crítica                                       |
| **Estimación**      | 2 días                                           |
| **Estado**          | ⬜ Pendiente                                     |
| **Rama**            | `hu-209-panel-de-inicio-por-rol-<persona>`       |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | HU-104 (✅), HU-201 (✅), HU-203 (✅)            |
| **Labels**          | `sprint-2` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante, profesor o administrador,
> **Quiero** que al entrar aterrice en una página de inicio que hable de lo mío y sea cierta,
> **Para** saber qué hacer a continuación sin recorrer la plataforma buscándolo.

## Contexto

**`PanelPage` miente a dos de los tres roles.** Le dice al profesor _"Todavía no puedes crear
aulas"_ —falso desde HU-201— y al estudiante _"Todavía no hay aulas publicadas"_ —falso desde
HU-203—. Las dos frases eran ciertas cuando se escribieron y llevan dos historias sin actualizarse.
Un usuario que entra hoy lee que el producto no hace lo que acaba de hacer.

Y hay un problema de estructura debajo del texto: **el administrador aterriza en un panel que no es
suyo.** `/panel` le habla como a un usuario cualquiera y su trabajo real —aprobar profesores— vive
en `/admin`, escondido detrás de una tarjeta. Dos pantallas para una función, con la principal en
segundo plano.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.8 (visibilidad por rol), §8 (autorización en el
  servidor).
- **Skills:** `bighearts-ui` → `layout-y-composicion.md` (una sola acción primaria por pantalla) y
  `voz-microcopy.md` (los vacíos invitan a actuar).
- **Reutiliza:** `<RoleGate>`, `usePendingTeachers`, `<PendingTeachersTable>`, `useResolveTeacher`,
  `<EstadoVacio>`, `<AppShell>`, `<PaginaCabecera>`.
- **⚠️ HU-104 está cerrada y probada.** Su lógica de aprobación **no se reescribe: se recoloca**.
  Los tests de `AdminPage.spec.tsx` se mueven con ella, no se borran.

### Decisiones tomadas (2026-08-20)

**1. `/panel` es el inicio de todos los roles, y su contenido cambia según quién entra.** Para el
administrador, ese inicio **es** su panel de operación: la aprobación de profesores deja de estar a
un clic escondido y pasa a ser lo primero que ve.

**2. `/admin` se pliega dentro de `/panel` y queda como redirección.** No se elimina la ruta:
cualquier enlace guardado o marcador sigue funcionando. Simplemente lleva a donde ahora vive la
función.

**3. El panel no promete lo que no existe.** Cada bloque muestra datos reales o un vacío que invita
a actuar. **Se prohíbe el texto en futuro** —"cuando esté disponible", "todavía no puedes"—: es
exactamente lo que produjo esta HU.

## 🔧 Tasks

### Frontend

- [ ] **T1** — Borrar de `PanelPage` los dos textos falsos: _"Todavía no puedes crear aulas"_ y
      _"Todavía no hay aulas publicadas"_. **Antes que nada**, para que la mentira no sobreviva ni
      un commit más de lo necesario.
- [ ] **T2** — Panel del **estudiante**: sus próximas clases reservadas, o un vacío que lleve al
      catálogo. Acción primaria única: `Explorar clases`.
- [ ] **T3** — Panel del **profesor**: sus próximas clases a impartir, o un vacío que lleve a
      crear. Acción primaria única: `Crear una clase`.
- [ ] **T4** — Panel del **administrador**: los profesores pendientes de aprobación **en primer
      plano**, con la tabla y las acciones que ya existen de HU-104. Si no hay ninguno, el vacío
      normal —una academia sana no tiene solicitudes esperando, y eso no es un error.
- [ ] **T5** — Mover `PendingTeachersTable` y su lógica de `AdminPage` al panel del administrador.
      Mover también sus tests.
- [ ] **T6** — `/admin` pasa a redirigir a `/panel`. La ruta no desaparece.
- [ ] **T7** — Los 4 estados en cada uno de los tres paneles: cargando con texto, vacío, error y
      contenido.
- [ ] **T8** — Tests: cada rol ve su panel y **no** ve el de los otros dos; los textos borrados no
      reaparecen; `/admin` redirige; `axe` limpio en los tres paneles y en los tres temas.

### Documentación

- [ ] **T9** — Actualizar `ARQUITECTURA.md` §9 con la estructura de rutas resultante, y recorrer la
      tabla de §6 del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [ ] **AC1** — **Ninguna de las dos frases falsas queda en el código.**
      `grep -rn "Todavía no puedes crear aulas\|Todavía no hay aulas publicadas" apps/web/src` no
      devuelve nada.
- [ ] **AC2** — Un **estudiante** en `/panel` ve sus próximas clases reservadas, o un vacío que
      lleva al catálogo. No ve nada del profesor ni del administrador.
- [ ] **AC3** — Un **profesor** en `/panel` ve sus próximas clases a impartir, o un vacío que lleva
      a crear una.
- [ ] **AC4** — Un **administrador** en `/panel` ve los profesores pendientes **como contenido
      principal**, no detrás de un enlace, y puede aprobarlos y rechazarlos ahí mismo.
- [ ] **AC5** — Aprobar y rechazar siguen funcionando exactamente igual que en HU-104: mismos
      códigos de error, mismo anuncio por región viva, mismos tests pasando tras moverse.
- [ ] **AC6** — Entrar en `/admin` lleva a `/panel`. Un marcador antiguo no se rompe.
- [ ] **AC7** — **Una sola acción primaria por panel.** Ninguno de los tres pinta dos.
- [ ] **AC8** — **Cero texto en futuro.** Ningún panel dice "cuando esté disponible", "próximamente"
      ni "todavía no". Los vacíos invitan a actuar, según `voz-microcopy.md`.
- [ ] **AC9** — **Accesibilidad:** un solo `<h1>` por panel, foco al `<h1>` al navegar, recorrido
      completo con teclado, `axe` limpio en los tres roles y en `light`, `dark` y `hc`.
- [ ] **AC10** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **La vista de supervisión global de aulas del administrador** → HU-210. Aquí el admin solo ve
  aprobaciones.
- **Métricas y estadísticas** en cualquiera de los tres paneles. Fase posterior.
- **Cambiar la lógica de aprobación de HU-104.** Se recoloca, no se reescribe.
- Notificaciones o avisos dentro del panel.
- Personalización del panel por parte del usuario.

## Notas de implementación

_Se rellena al cerrar._
