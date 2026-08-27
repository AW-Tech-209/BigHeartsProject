# HU-304 — El enlace se revela dentro de su ventana

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Sprint 3 — Sistema de Reservas                    |
| **Prioridad**       | 🔴 Crítica                                        |
| **Estimación**      | 2 días                                            |
| **Estado**          | ✅ Hecho                                          |
| **Rama**            | `hu-304-acceso-al-enlace-<persona>`               |
| **Alcance técnico** | fullstack                                         |
| **Depende de**      | HU-301, HU-302                                    |
| **Labels**          | `sprint-3` `prioridad:critica` `fullstack` `a11y` |

> **Como** estudiante con reserva confirmada,
> **Quiero** ver el enlace de la videollamada cuando la clase está a punto de empezar,
> **Para** entrar a mi clase sin que ese enlace circule por ahí el resto del tiempo.

## Contexto

Es el último paso de la prueba definitiva del producto, y **la HU está a medio hacer desde el
Sprint 2**. La decisión **D25** lo dejó preparado: el enlace se revela **solo en
`GET /classrooms/:id`**, y toda la regla vive en un único método privado, `revelarElEnlace()`, cuya
mitad de estudiante no se pudo escribir porque `Booking` no existía.

**Esta HU extiende ese método. No crea un endpoint nuevo.** La HU original planteaba un
`GET /classrooms/:id/meeting-link` aparte; eso quedó descartado por D25, porque dos sitios que
deciden lo mismo acaban decidiendo distinto, y el que se equivoque regala una sala.

Y una regla que ya está escrita y hay que respetar: **un aula `CANCELLED` no revela su enlace a
nadie**, ni al profesor dueño. Esa reunión no va a ocurrir.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.1 **entera** (es la tabla que esta HU completa), **D25**, §4.7
  (el servidor decide, siempre), §7.3 estado 5 `acceso-abierto`.
- **Skills:** `bighearts-backend` → `reglas-reservas.md` · `bighearts-ui`.
- **Reutiliza:** `MeetingLinkCipher` y `revelarElEnlace()` de HU-204, `derivarEstadoAula()` —el
  estado `acceso-abierto` ya está definido y se vuelve alcanzable aquí—.
- **Decisiones pendientes:** `ACCESS_WINDOW_MINUTES` **no está en** `config/env.schema.ts`; el
  comentario de `CLASS_MIN_LEAD_MINUTES` ya anticipa que entra en esta HU. Añádelo con Zod, por
  defecto 30, y **haz que `CLASS_MIN_LEAD_MINUTES` valide contra él** en vez de contra la constante.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: el estado de acceso que ve el frontend (`aún no` · `abierto` ·
      `sin acceso`) y el instante en que se abre la ventana, para pintar la cuenta atrás sin
      recalcular la regla. Luego `npm run build:types`.

### Backend

- [x] **T2** — `ACCESS_WINDOW_MINUTES` en `config/env.schema.ts`, por defecto 30, y
      `CLASS_MIN_LEAD_MINUTES` pasa a validarse contra esta variable.
- [x] **T3** — Extender `revelarElEnlace()` con la mitad que faltaba: un `STUDENT` con
      `Booking.status = CONFIRMED` lo ve desde `scheduledAt − ACCESS_WINDOW_MINUTES` hasta el final
      de la clase. **Un método, no dos ramas sueltas.**
- [x] **T4** — Fuera de la ventana el campo **se omite**: no viaja vacío, ni cifrado, ni `null`.
      Con el aula `CANCELLED`, no viaja para nadie.
- [x] **T5** — Tests de la tabla de §4.1 **completa**: a 31 min ausente y a 29 min presente; el
      estudiante sin reserva nunca lo obtiene **aunque conozca el id**; con reserva `CANCELLED`
      tampoco; el profesor dueño sí, siempre, salvo aula cancelada; y otro profesor no.

### Frontend

- [x] **T6** — En el detalle y en «Mis reservas»: antes de la ventana, cuándo se abrirá, en la zona
      del usuario. Al abrirse, el botón de entrar a la clase. Sin reserva, ni una cosa ni la otra.
- [x] **T7** — El paso de «aún no» a «abierto» se **anuncia por región viva** al ocurrir en
      pantalla, y el estado se comunica con color + ícono + texto. Cero dependencia del audio.

## ✅ Criterios de aceptación

- [x] **AC1** — A **31 minutos** del inicio el campo del enlace **no aparece** en la respuesta; a
      **29 minutos**, sí. Verificado con tests, no a ojo.
- [x] **AC2** — Un usuario **sin reserva `CONFIRMED`** nunca obtiene el enlace, aunque pida el aula
      por su id directamente. Tampoco quien canceló.
- [x] **AC3** — Un aula `CANCELLED` **no revela el enlace a nadie**, ni al profesor dueño.
- [x] **AC4** — El profesor dueño lo ve **siempre** —fuera de la ventana también—, y otro profesor
      no lo ve nunca.
- [x] **AC5** — Fuera de la ventana la interfaz dice **cuándo** se abrirá, con la zona explícita, y
      la apertura se anuncia por región viva.
- [x] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Registrar asistencia al entrar.** La HU original lo pedía; quedó **invalidado** por la nota de
  auditoría #2 de `DEFINICION_PROYECTO.md`: con enlace manual de Zoom o Meet, un clic no prueba que
  nadie entrara. La asistencia **la marca el profesor**, y va en el Sprint 4 con el historial.
- **El recordatorio de 30 minutos**, que ocurre en el mismo instante que esta ventana → Sprint 4.
- **Endpoint propio para el enlace.** Descartado por D25.
- Salas generadas por la plataforma. En Fase 1 `MeetingProvider` es siempre `MANUAL`.

## Notas de implementación

`accessState`/`accessOpensAt` se añadieron a `ClassroomListItem` (no solo a `ClassroomDetail`), con
default `sin-acceso`/`null`: solo `GET /classrooms/:id` y `GET /bookings/mias` los calculan de
verdad, vía la regla pura compartida `derivarAccesoAlEnlace()` (`apps/api/src/classrooms/acceso-enlace.rules.ts`).
`CLASS_MIN_LEAD_MINUTES` pasó de `.min()` de campo a un `.refine()` del esquema completo, porque el
suelo ya es otra variable del entorno y no una constante.
