# HU-515 — «¿Pudiste seguir la clase?»

| Campo               | Valor                                                       |
| ------------------- | ----------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                                            |
| **Prioridad**       | 🟡 Media                                                    |
| **Estimación**      | 2 días                                                      |
| **Estado**          | ✅ Hecha                                                    |
| **Asignada a**      | **Dev A** (T1–T3) · **Dev B** (T4–T5)                       |
| **Rama**            | `hu-515-pudiste-seguir-la-clase-a` / `-b`                   |
| **Alcance técnico** | fullstack                                                   |
| **Depende de**      | ninguna                                                     |
| **Labels**          | `post-fase-1` `prioridad:media` `fullstack` `a11y` `prisma` |

> **Como** estudiante que acaba de salir de una clase,
> **quiero** decir en un toque si pude seguirla y qué falló,
> **para** que el profesor sepa si el intérprete, los subtítulos o el ritmo funcionaron.

## Contexto

Hoy el aula **declara** cómo se imparte (§4.9, regla 4: «de buena fe») y nadie sabe si en la práctica
funcionó. Esto no cambia la regla: **no audita ni sanciona**, solo informa. Decisión nueva **D47**:
la valoración es **anónima para el profesor**, que ve solo el agregado de cada clase, nunca quién
respondió qué. Con grupos pequeños la anonimidad es débil, por eso el agregado solo se muestra con
**3 respuestas o más**.

## Referencias

- **Archivos a tocar:** `packages/types/src/index.ts`, `apps/api/prisma/schema.prisma` + migración,
  `apps/api/src/bookings/` (endpoint del estudiante), `apps/api/src/historial/` (agregado del
  profesor), `apps/web/src/features/panel/components/panel-estudiante.tsx`,
  `apps/web/src/features/historial/components/*`, `apps/web/src/features/valoracion/` (nueva).
- **Reglas:** `ARQUITECTURA.md` → «4.9 Accesibilidad declarada del aula» (regla 4) y «4.8
  Visibilidad y acciones por rol». Skill `bighearts-backend` para el DTO y el mapper.
- **Decisiones pendientes:** ninguna (D47 queda propuesta arriba; si el cliente la cambia, se ajusta
  antes de T3).

## Tasks

- [x] **T1** — Contrato y modelo: enums `SeguimientoClase` (`SI`, `A_MEDIAS`, `NO`) y
      `ProblemaClase` (`INTERPRETE`, `SUBTITULOS`, `CONEXION`, `RITMO`, `OTRO`). Tabla
      `class_feedback` (`bookingId` **único**, `seguimiento`, `problemas[]`, `comentario?` ≤ 500,
      `createdAt`). Sin `studentId` propio: sale de la reserva.
- [x] **T2** — `POST /bookings/:id/valoracion` (`@Roles(STUDENT)`): solo el dueño de la reserva,
      reserva `CONFIRMED` o `ATTENDED`, con `now ≥ endsAt` y hasta 7 días después, una sola vez
      (409 `FEEDBACK_ALREADY_SENT`). `problemas` solo se acepta si `seguimiento ≠ SI`. La reserva que
      devuelve `GET /bookings/mias` trae `puedeValorar: boolean`.
- [x] **T3** — Agregado para el profesor dueño en su historial (`GET /historial`, fila de cada aula):
      `valoracion: { respuestas, si, aMedias, no, problemas: Record<ProblemaClase, number> } | null`.
      `null` con menos de 3 respuestas. Los comentarios **no** viajan al profesor en esta HU.
- [x] **T4** — Estudiante: en el panel, una tarjeta «¿Pudiste seguir la clase {título}?» para la
      reserva más reciente con `puedeValorar`, con tres opciones grandes (ícono + texto: «Sí», «A
      medias», «No»). Si no es «Sí», se ofrecen los problemas en chips y un comentario opcional. En
      el historial, la misma acción en la fila. Tras enviar: «Gracias. Se lo contamos al profesor sin
      decir tu nombre».
- [x] **T5** — Profesor: en su historial, por aula, «8 respuestas · 6 sí · 2 a medias» y los problemas
      más citados, con texto (sin gráficas circulares). Con `null`: «Aún no hay suficientes respuestas
      para mostrar».
- [x] **T6** — Tests: autorización (otro estudiante → 404, profesor → 403), ventana de 7 días, doble
      envío → 409, agregado `null` con 2 respuestas y con valores con 3; `axe` en la tarjeta.

## Criterios de aceptación

- [x] **AC1** — Un estudiante puede valorar su reserva solo entre el fin de la clase y 7 días
      después, y una sola vez. El segundo intento responde 409 `FEEDBACK_ALREADY_SENT`.
- [x] **AC2** — Ninguna respuesta de la API al profesor incluye nombre, id ni correo de quien valoró,
      ni el comentario (verificado en el test del mapper).
- [x] **AC3** — Con 2 respuestas, el profesor ve «Aún no hay suficientes respuestas». Con 3, ve los
      conteos correctos.
- [x] **AC4** — Elegir «Sí» envía en un solo paso. «A medias» y «No» muestran los problemas, que son
      opcionales.
- [x] **AC5** — La tarjeta del panel desaparece al enviar y no vuelve para esa reserva.

## Fuera de alcance

- Comentarios visibles para el admin y agregado global: van al panel de métricas (HU-516/517).
- Recordatorio por correo para valorar.
- Cualquier consecuencia para el profesor. Es información, no auditoría.

## Notas de implementación

- Añadido `FEEDBACK_WINDOW_CLOSED` (409) para fuera de ventana o reserva no valorable; `puedeValorar` es opcional en `ClassroomListItem`.
- `FilaLista` gana la prop `detalle` para el resumen del profesor.
