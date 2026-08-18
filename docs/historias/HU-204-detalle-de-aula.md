# HU-204 — Detalle de un aula

| Campo            | Valor                                          |
| ---------------- | ---------------------------------------------- |
| **Sprint**       | Sprint 2 — Gestión de Aulas                    |
| **Prioridad**    | 🟠 Alta                                        |
| **Estimación**   | 2 días                                         |
| **Estado**       | ⬜ Pendiente                                   |
| **Rama**         | `hu-204-detalle-de-aula-<persona>`             |
| **Colaboración** | Paralelo con contrato acordado                 |
| **Depende de**   | HU-203                                         |
| **Labels**       | `sprint-2` `prioridad:alta` `fullstack` `a11y` |

> **Como** estudiante o profesor,
> **Quiero** ver el detalle completo de un aula,
> **Para** conocer toda su información antes de reservar o gestionarla.

## Contexto

Cierra el Sprint 2: es la pantalla a la que redirige la creación (HU-201), desde donde el profesor
edita o cancela (HU-202) y donde en el Sprint 3 aparecerán el botón de reservar y la ventana de
acceso al enlace.

Por eso importa que su estructura quede bien ahora: HU-301 y HU-303 van a colgar de aquí.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.1 (quién ve el enlace), §7.3 (derivación de
  estados), §4.7 (zonas horarias).
- **Skills:** `bighearts-backend` · `bighearts-ui`.
- **Reutiliza de HU-203:** `derivarEstadoAula()`, `<EstadoAula>` e `<IndicadorCupo>`. No los
  dupliques.

### Decisiones de auditoría (2026-08-18)

**1. En este sprint el enlace se devuelve únicamente al profesor dueño.** La regla completa
—estudiante con reserva `CONFIRMED` dentro de la ventana de 30 minutos— necesita `Booking`, que no
existe hasta el Sprint 3. **HU-303 la completa.** Deja el punto de decisión aislado en un método
del servicio para que HU-303 solo tenga que extenderlo, no reescribir el endpoint.

**2. El "estado de reserva del usuario actual" sale de esta HU.** No hay `Booking` en Sprint 2. El
campo existe en el contrato y llega vacío; HU-301 lo rellena.

**3. Un aula `CANCELLED` sigue siendo visible en el detalle**, aunque no aparezca en el listado.
Quien tenga el enlace de la página debe poder entender qué pasó, no toparse con un 404 — el
producto se juega la confianza del usuario, y un 404 aquí parece un error de la plataforma.
**Sin enlace de reunión, en ningún caso.**

## 🤝 Task de contrato — va primero

- [ ] **T0** — En `packages/types`: el tipo `ClassroomDetail` (todo lo del listado + `description` + los datos del profesor + `meetingLink` **opcional y omitido** cuando no aplica + el campo
      de reserva propia, vacío en este sprint). Luego `npm run build:types`.

## 🔧 Tasks — Dev A (backend)

- [ ] **A1** — `GET /classrooms/:id` con el detalle completo del aula. Accesible a cualquier
      usuario autenticado.
- [ ] **A2** — **Un único método** que decide si el enlace viaja. En Sprint 2 su regla es "el que
      pide es el profesor dueño". Documentado con un comentario que apunte a HU-303 como la HU que
      lo extiende. El campo **se omite**, no viaja vacío ni en `null`.
- [ ] **A3** — Un aula `CANCELLED` se devuelve con su estado; un `id` inexistente responde
      `404 CLASSROOM_NOT_FOUND`.
- [ ] **A4** — Tests: dueño recibe enlace; otro profesor, estudiante y admin **no**; aula cancelada
      visible sin enlace; id inexistente `404`.

## 🔧 Tasks — Dev B (frontend)

- [ ] **B1** — Vista de detalle con un solo `<h1>` (el título del aula) y el foco movido a él al
      entrar en la ruta (`usePageTitle` ya lo hace; úsalo).
- [ ] **B2** — Información completa: profesor, nivel, descripción, fecha con **zona explícita**,
      duración y cupo con `<IndicadorCupo>`.
- [ ] **B3** — Estado del aula con `<EstadoAula>`, derivado con la función compartida.
- [ ] **B4** — CTA contextual por rol: profesor dueño → `Editar clase` y `Cancelar clase`
      (HU-202); estudiante y resto → solo lectura en este sprint. **No pintes un botón de reservar
      deshabilitado**: el skill prohíbe deshabilitar sin explicar, y aquí no hay nada que explicar
      todavía.
- [ ] **B5** — Los 4 estados: cargando, no encontrada, error y contenido.

## ✅ Criterios de aceptación

- [ ] **AC1** — El detalle muestra título, profesor, nivel, descripción, fecha con zona explícita,
      duración, cupo y estado.
- [ ] **AC2** — **El profesor dueño recibe el `meetingLink`.** Cualquier otro usuario —otro
      profesor, un estudiante, un admin— recibe una respuesta **sin ese campo**: no está presente,
      no llega en `null`, no llega cifrado. Verificado con tests por cada rol.
- [ ] **AC3** — Un `id` inexistente responde `404 CLASSROOM_NOT_FOUND` y la interfaz muestra un
      estado de "no encontrada" con salida hacia el listado, no una pantalla en blanco.
- [ ] **AC4** — Un aula `CANCELLED` se puede abrir: muestra su estado con color + ícono + texto,
      sin acciones y sin enlace.
- [ ] **AC5** — El CTA cambia según el rol: el dueño ve editar y cancelar; el resto, ninguna acción
      de gestión.
- [ ] **AC6** — El estado del aula usa `derivarEstadoAula()` de `@academia/types`, sin una segunda
      implementación en la pantalla.
- [ ] **AC7** — **Accesibilidad:** un solo `<h1>`, el foco salta a él al navegar, la página se
      recorre entera con teclado con foco visible, funciona en `.dark` y `.hc`, y cumple el
      checklist del skill `bighearts-ui`.
- [ ] **AC8** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde.

## 🚫 Fuera de alcance

- **Botón de reservar** → HU-301.
- **Ventana de acceso de 30 minutos y enlace para estudiantes** → HU-303. Aquí solo queda aislado
  el punto donde esa regla va a vivir.
- **Estado de reserva propia** (`Tienes tu cupo`, `Ya puedes entrar`) → HU-301 y HU-303.
- **Lista de estudiantes inscritos** para el profesor → HU-304.
- Compartir el aula por enlace público sin autenticación.

## Notas de implementación

_Se rellena al cerrar._
