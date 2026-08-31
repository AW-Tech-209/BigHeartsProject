# HU-403 — El profesor marca la asistencia

| Campo               | Valor                                          |
| ------------------- | ---------------------------------------------- |
| **Sprint**          | Sprint 4 — Notificaciones e Historial          |
| **Prioridad**       | 🟠 Alta                                        |
| **Estimación**      | 2 días                                         |
| **Estado**          | ⬜ Pendiente                                   |
| **Rama**            | `hu-403-marcar-la-asistencia-<persona>`        |
| **Alcance técnico** | fullstack                                      |
| **Depende de**      | HU-305 (✅)                                    |
| **Labels**          | `sprint-4` `prioridad:alta` `fullstack` `a11y` |

> **Como** profesor,
> **Quiero** marcar quién asistió a mi clase cuando termina,
> **Para** que quede un registro formal de lo que ocurrió.

## Contexto

La asistencia de esta plataforma es **manual y la marca el profesor**. No es un detalle de
implementación: es una **nota de auditoría** de `DEFINICION_PROYECTO.md` (#2), que corrigió a la
arquitectura original cuando decía que se registraría sola al revelarse el enlace. Con una sala de
Zoom o Meet que la plataforma no controla, un clic en «entrar» no prueba que nadie entrara, ni que
se quedara. **La única fuente de verdad del historial es lo que diga el profesor.**

El enum ya existe: `BookingStatus` lleva `ATTENDED` y `NO_SHOW` desde HU-301, con el comentario
_«los fija el profesor al marcar asistencia (HU-404)»_ — hoy son valores que nadie escribe.

La pantalla también existe: HU-305 construyó la lista de inscritos con el perfil de accesibilidad
de cada uno. **Esta HU le añade la acción**, no monta una pantalla nueva.

### Decisión D33 — cuándo se puede marcar, y hasta cuándo

**Desde que la clase termina, y se puede corregir después sin límite.** No hay ventana de bloqueo
en la Fase 1, por una razón práctica: un profesor que se equivoca marcando no tiene ninguna otra
vía de arreglarlo, y dejar un registro falso congelado es peor que permitir la corrección. Antes de
que la clase acabe la acción **no existe** — marcar asistencia de algo que no ha ocurrido no
significa nada.

### Lo que ve el estudiante

Que aparezca `NO_SHOW` en su historial es información sensible sobre él. **Se muestra, con texto
neutro y sin juicio** —«No asististe», nunca «Faltaste» ni un ícono de alerta—, porque un registro
que el interesado no puede consultar no es un registro, es un expediente. El microcopy lo decide
`voz-microcopy.md`.

## Dependencias técnicas

- **Reglas:** `DEFINICION_PROYECTO.md` nota de auditoría #2 y §5.1, `ARQUITECTURA.md` §4.7 (la clase
  termina según el reloj del servidor), §7.3.
- **Skills:** `bighearts-ui` → `voz-microcopy.md` (el texto de `NO_SHOW` es lo delicado aquí) ·
  `bighearts-backend`.
- **Reutiliza:** la lista de inscritos de HU-305 **entera**, `BookingStatus` con sus cuatro valores,
  el patrón de autorización por dueño de `GET /classrooms/:id/inscritos`.
- **Decisiones pendientes:** ninguna. D33 queda tomada aquí.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: el cuerpo del marcado y los códigos `CLASS_NOT_FINISHED` y
      `BOOKING_NOT_IN_CLASSROOM`. Luego `npm run build:types`.

### Backend

- [x] **T2** — `POST /classrooms/:id/asistencia` con `@Roles('TEACHER')`, **acotado al dueño**: si
      el aula no es suya, `404`.
- [x] **T3** — Solo se marca **después** de que la clase termine (`now ≥ scheduledAt +
  durationMinutes`); antes, `CLASS_NOT_FINISHED`. Solo se tocan reservas de **esa** aula.
- [x] **T4** — Una reserva `CANCELLED` **no** se puede marcar: quien canceló no faltó.
      `CONFIRMED → ATTENDED | NO_SHOW`, y corregir entre esos dos, son las únicas transiciones.
- [x] **T5** — Tests: otro profesor → `404`; un `STUDENT` → `403`; antes de terminar →
      `CLASS_NOT_FINISHED`; una `CANCELLED` no cambia; corregir de `ATTENDED` a `NO_SHOW` funciona;
      y **`currentBookings` no se toca** — marcar asistencia no libera cupos.

### Frontend

- [x] **T6** — En la lista de inscritos de HU-305, un control por estudiante para asistió / no
      asistió, **accesible por teclado**, con el estado en color + ícono + texto. Guardado explícito
      con confirmación anunciada por región viva.
- [x] **T7** — Mientras la clase no termine, el control **no aparece** y se explica desde cuándo se
      podrá marcar. Nunca un botón muerto sin motivo.

## ✅ Criterios de aceptación

- [x] **AC1** — Terminada la clase, el profesor dueño marca cada inscrito como `ATTENDED` o
      `NO_SHOW`, y puede corregirse después.
- [x] **AC2** — Antes de que la clase termine la API responde `CLASS_NOT_FINISHED` y la interfaz no
      ofrece la acción.
- [x] **AC3** — **Autorización:** otro profesor recibe `404` y un `STUDENT` recibe `403`. Una
      reserva de otra aula no se puede marcar desde esta.
- [x] **AC4** — Una reserva `CANCELLED` **no** cambia de estado, y `currentBookings` **no se
      modifica** en ningún caso.
- [x] **AC5** — El estado marcado se comunica con color + ícono + texto, el guardado se anuncia por
      región viva, y todo el control se maneja con teclado.
- [x] **AC6** — **Verificación:** `typecheck`, `lint`, `build`, `npm run test` en verde y `axe`
      limpio.

## 🚫 Fuera de alcance

- **Ver la asistencia en el historial** → HU-404. Esta HU la escribe; aquella la muestra.
- **Prerrellenar** con una señal automática de acceso al enlace. La nota de auditoría #2 la descartó
  por no ser fiable.
- **Avisar al estudiante** de que fue marcado ausente. Ningún aviso nuevo en esta HU.
- **Duración real** de la clase o notas del profesor. Necesitarían una entidad que no existe.
- **Que el admin marque o corrija** asistencia. Sigue siendo solo lectura.

## Notas de implementación

`InscritoAula` ganó `bookingId` (no estaba en el contrato de HU-305) porque el control de
asistencia necesita identificar qué reserva marcar. `getInscritos` ahora también incluye
`ATTENDED`/`NO_SHOW` dentro de `confirmados` (son un `CONFIRMED` con asistencia ya decidida, no un
grupo aparte); solo `CANCELLED` sale de ahí.
