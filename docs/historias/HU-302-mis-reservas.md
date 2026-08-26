# HU-302 — Mis reservas: el estudiante encuentra su clase

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Sprint 3 — Sistema de Reservas                    |
| **Prioridad**       | 🔴 Crítica (es la prueba definitiva del producto) |
| **Estimación**      | 1.5 días                                          |
| **Estado**          | ⬜ Pendiente                                      |
| **Rama**            | `hu-302-mis-reservas-<persona>`                   |
| **Alcance técnico** | fullstack                                         |
| **Depende de**      | HU-301                                            |
| **Labels**          | `sprint-3` `prioridad:critica` `fullstack` `a11y` |

> **Como** estudiante,
> **Quiero** una pantalla con mis clases reservadas,
> **Para** saber a qué hora es la próxima y llegar a ella sin buscarla por el catálogo.

## Contexto

`/mis-clases` existe desde HU-206 **como estado vacío**, con su enlace en la barra de navegación.
Se registró vacía a propósito (D18): un destino visible que cae en 404 enseña a desconfiar de la
navegación. **Esta HU es la que lo rellena.**

Y es la que decide el producto. `CLAUDE.md` lo dice arriba del todo: _si un estudiante sordo entra,
encuentra su clase y llega a la videollamada sin pedirle ayuda a nadie, funcionó._ Reservar sin un
sitio donde volver a encontrar lo reservado no es un sistema de reservas.

Es la contraparte de «Mis aulas» del profesor (HU-207). **Copia su forma**, incluida la decisión
D24 sobre los filtros: `proximas`, `pasadas` y `canceladas` son grupos disjuntos, el estado gana
sobre la fecha, y `todas` es su unión.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.8 (el alcance sale del token, nunca de un parámetro), **D24**
  (los tres filtros temporales), §7.3.
- **Skills:** `bighearts-ui` → `layout-y-composicion.md` (tarjeta, no fila: el estudiante escanea
  para elegir a cuál entrar) · `bighearts-backend` → `contrato-api.md`.
- **Reutiliza:** la pantalla de HU-207 casi entera, `derivarEstadoAula()`, `<EstadoAula>`, la
  paginación de HU-203, `<EstadoVacio>`.
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### Contrato — va primero

- [ ] **T1** — En `packages/types`: filtros de «mis reservas» y el tipo de respuesta. **Reutiliza
      el item de listado de aula**; no declares un tipo paralelo. Luego `npm run build:types`.

### Backend

- [ ] **T2** — `GET /bookings/mias` con `@Roles('STUDENT')`, acotado **al token**. Devuelve las
      reservas del estudiante con los datos del aula y su `myBookingStatus`.
- [ ] **T3** — Filtros `proximas` · `pasadas` · `canceladas` · `todas`, con la semántica de D24.
      `todas` se sirve como dos listas concatenadas: próximas ascendente, historial descendente.
- [ ] **T4** — El `meetingLink` **no viaja** aquí. §4.8 regla 2, sin excepción: es un listado.
- [ ] **T5** — Tests: el alcance no se puede ampliar con ningún parámetro; los tres filtros suman
      el total y ninguna reserva aparece dos veces; `meetingLink` ausente.

### Frontend

- [ ] **T6** — Rellenar `/mis-clases`: tarjetas con estado, fecha con zona explícita, profesor y
      modos de comunicación. Los 4 estados. El vacío dice qué hacer y lleva al catálogo.

### Documentación

- [ ] **T7** — Retirar la nota de «pendiente de Sprint 3» que D18 dejó sobre esta ruta.

## ✅ Criterios de aceptación

- [ ] **AC1** — Un estudiante con reservas ve **sus** clases en `/mis-clases`, ordenadas por
      cercanía, con la próxima primero.
- [ ] **AC2** — Los tres filtros son **disjuntos y exhaustivos**: suman el total y ninguna reserva
      sale en dos. Una clase cancelada del mes que viene aparece en `canceladas`, no en `proximas`.
- [ ] **AC3** — **Autorización:** el alcance sale del token. No hay parámetro que devuelva las
      reservas de otro, y un `TEACHER` o `ADMIN` recibe `403`.
- [ ] **AC4** — **El `meetingLink` no aparece** en la respuesta. Verificado con un test.
- [ ] **AC5** — Sin reservas, la pantalla explica cómo conseguir una y enlaza al catálogo. No se
      queda en blanco ni promete algo que no existe.
- [ ] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Cancelar** desde aquí → HU-303 añade la acción sobre esta pantalla.
- **Entrar a la clase** → HU-304.
- **Historial con asistencia** → Sprint 4. Aquí «pasadas» es solo el filtro temporal: no dice si
  el estudiante asistió, porque nadie lo ha marcado todavía.

## Notas de implementación

_Se rellena al cerrar._
