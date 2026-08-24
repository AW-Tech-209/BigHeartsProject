# HU-202 — Editar o cancelar un aula propia

| Campo               | Valor                                   |
| ------------------- | --------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas             |
| **Prioridad**       | 🟠 Alta                                 |
| **Estimación**      | 2.5 días                                |
| **Estado**          | ⬜ Pendiente                            |
| **Rama**            | `hu-202-editar-cancelar-aula-<persona>` |
| **Alcance técnico** | fullstack                               |
| **Depende de**      | HU-201, HU-203, HU-204                  |
| **Labels**          | `sprint-2` `prioridad:alta` `fullstack` |

> **Por qué depende de las tres.** De HU-201 reutiliza el formulario en modo edición. De HU-204
> toma su punto de entrada: el botón `Editar clase` vive en el detalle, no flota en el aire. Y su
> AC2 —"al cancelar, el aula desaparece del listado público"— **no se puede verificar sin HU-203**.
> Por eso esta HU va al final del sprint aunque su número sea el segundo: el número identifica, no
> ordena.

> **Como** profesor,
> **Quiero** editar los datos de un aula que creé o cancelarla,
> **Para** corregir información o suspender una clase cuando sea necesario.

## Contexto

Un enlace mal pegado o una hora equivocada no pueden obligar a borrar el aula y crearla de nuevo.
Y cancelar tiene que ser una acción de primera clase: en Sprint 3 será lo que libere cupos, así que
el estado `CANCELLED` debe quedar bien definido desde ahora.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §7.2 (estados del aula), §4.1 (cifrado del
  enlace), §8 (autorización en el servidor).
- **Skills:** `bighearts-backend` · `bighearts-ui` → **lee `patrones-dominio.md`** (acciones
  destructivas con `AlertDialog` y verbos).

### Decisiones de auditoría (2026-08-18)

**1. La notificación a estudiantes reservados sale de esta HU.** La versión original decía
"disparar notificación a estudiantes con reserva", pero **`Booking` no existe hasta el Sprint 3**:
en este sprint no hay a quién notificar. Cancelar deja el aula en `CANCELLED` y ya. La notificación
se añade cuando existan las reservas, en el Sprint 3/4.

**2. La regla no es "no editar un aula `COMPLETED`", es "no editar un aula que ya empezó".**
`COMPLETED` no tiene escritor en Fase 1 (`ARQUITECTURA.md` §7.2 — se deriva por tiempo hasta que
HU-404 lo persista), así que una regla escrita contra ese estado nunca se dispararía. La condición
verificable es `now ≥ scheduledAt`.

**3. Reducir `maxStudents` por debajo de `currentBookings` no se valida aquí.** En Sprint 2
`currentBookings` es siempre `0`. Esa regla nace con las reservas, en el Sprint 3, y hay que
añadirla a esta pantalla entonces. Anotado en _Fuera de alcance_ para que no se pierda.

### Deuda heredada de HU-212 (2026-08-24) — no es opcional

**Esta HU cierra el AC8 de HU-212.** Al abrir el `PATCH` a `scheduledAt` y `durationMinutes`, las
tres reglas de coherencia temporal (§4.4) empiezan a poder romperse por ahí, que es justo lo que
HU-212 vino a impedir. **La lógica ya está escrita y no hay que reescribirla**: llama a
`ClassroomsService.assertCoherenciaTemporal({ …, excluirId: id })` desde `editar()`. Es público y
acepta `excluirId` desde el primer día precisamente para esto — sin ese id, un `PATCH` que no mueve
el horario chocaría contra el aula que se está editando.

En el frontend, el formulario en modo edición hereda los tres errores tal cual: el solapamiento se
pinta bajo «Día», la duración recorta el `<select>`, y el aviso de poca antelación abre
`<DialogoPocaAntelacion>` y se reintenta con `confirmarPocaAntelacion: true`. Añade a los tests de
edición el caso «editar sin mover el horario no choca consigo misma».

## 🔧 Tasks

**Una sola persona la implementa de punta a punta.** Agrupadas por capa, en orden.

### Contrato — va primero

- [ ] **T1** — En `packages/types`: `UpdateClassroomInput` (subconjunto editable de
      `CreateClassroomInput`) y los códigos `CLASSROOM_NOT_FOUND`, `CLASSROOM_FORBIDDEN` y
      `CLASSROOM_NOT_EDITABLE` en `ApiErrorCode`. Luego `npm run build:types`.

### Backend

- [ ] **T2** — `PATCH /classrooms/:id` con `@Roles('TEACHER')`. Verifica que el solicitante es el
      **dueño**; cualquier otro profesor recibe `CLASSROOM_FORBIDDEN` (403).
- [ ] **T3** — `POST /classrooms/:id/cancel` → `status = CANCELLED`. Misma verificación de dueño.
- [ ] **T4** — Reglas de estado: no se edita ni se cancela un aula con `now ≥ scheduledAt`, ni una
      ya `CANCELLED`. En ambos casos, `CLASSROOM_NOT_EDITABLE`.
- [ ] **T5** — Si el `meetingLink` cambia, se **vuelve a cifrar**. Nunca se guarda en claro ni
      queda el valor anterior accesible.
- [ ] **T6** — `UpdateClassroomDto`: mismas validaciones que en la creación para los campos que
      viajen. Omitir un campo lo deja intacto.
- [ ] **T7** — Tests: dueño edita, otro profesor `403`, estudiante `403`, aula empezada
      `CLASSROOM_NOT_EDITABLE`, cancelar dos veces, y que el enlace nuevo queda cifrado.

### Frontend

- [ ] **T8** — Reutilizar el formulario de HU-201 en modo edición, precargado. **Un solo
      componente con dos modos**, no dos formularios que se desincronicen.
- [ ] **T9** — Cancelar con `AlertDialog` **y verbos**: `Cancelar la clase` / `Volver`, nunca
      Sí/No. Variante `destructive`, y el texto advierte que la acción no se deshace.
- [ ] **T10** — Tras editar o cancelar: invalidar las queries de listado y detalle, y anunciar el
      resultado por `aria-live`.
- [ ] **T11** — En un aula que ya empezó, las acciones **no se deshabilitan en silencio**: se
      explica por qué (`Esta clase ya comenzó, no se puede editar.`). El skill prohíbe deshabilitar
      sin explicación.
- [ ] **T12** — El estado del aula se muestra con `<EstadoAula>` (color + ícono + texto), no solo
      con un cambio de color.

## ✅ Criterios de aceptación

- [ ] **AC1** — **Propiedad:** el profesor dueño edita y cancela su aula. Otro profesor recibe
      `403 CLASSROOM_FORBIDDEN` en ambos endpoints. Un estudiante también. Verificado en backend.
- [ ] **AC2** — Cancelar deja el aula en `status = CANCELLED`, y a partir de ahí **desaparece del
      listado público** (HU-203) y no se puede volver a editar.
- [ ] **AC3** — Un aula cuya `scheduledAt` ya pasó responde `CLASSROOM_NOT_EDITABLE` tanto al
      editar como al cancelar.
- [ ] **AC4** — Cambiar el enlace lo guarda cifrado de nuevo: consultando la columna no se lee la
      URL nueva en claro.
- [ ] **AC5** — Una edición parcial (por ejemplo, solo `title`) no modifica el resto de campos.
- [ ] **AC6** — Un `id` inexistente responde `404 CLASSROOM_NOT_FOUND`, no un 500.
- [ ] **AC7** — **La interfaz explica, no solo bloquea:** cuando una acción no está disponible, el
      usuario lee por qué.
- [ ] **AC8** — **Accesibilidad:** el diálogo de confirmación atrapa el foco, se cierra con `Esc`,
      sus botones dicen verbos, y el resultado se anuncia por `aria-live`. Cumple el checklist del
      skill `bighearts-ui`.
- [ ] **AC9** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` en
      verde. Una sola vez, al cerrar.

### Documentación

- [ ] **T13** — Recorrer la tabla de §6 del skill `bighearts-dod`.

## 🚫 Fuera de alcance

- **Notificar a los estudiantes reservados al cancelar.** No hay reservas hasta Sprint 3. Se añade
  con el `NotificationsModule` real, en Sprint 3/4.
- **Impedir bajar `maxStudents` por debajo de `currentBookings`.** Regla del Sprint 3; hay que
  volver a esta pantalla entonces.
- **Reprogramar un aula con reservas activas** (avisar, reconfirmar o liberar). Sprint 3.
- Borrar un aula: no se borra, se cancela.
- Reactivar un aula cancelada.

## Notas de implementación

_Se rellena al cerrar._
