---
name: bighearts-backend
description: Invariantes de negocio y convenciones de servidor de BigHearts — reservas, cupos, aulas, enlace de videollamada, auth, Prisma, DTOs y contrato de API. Úsalo al crear o editar endpoints, servicios, DTOs, guards, esquema o migraciones.
license: Proprietary
---

# BigHearts — backend

El servidor es la única autoridad. El frontend replica lógica para pintar, **nunca** para decidir un
permiso, un cupo o una ventana temporal.

**Stack:** NestJS 11 · **Prisma ^6** (no subir a 7) · PostgreSQL 17 · Zod para el entorno ·
`class-validator` para DTOs · `@nestjs/jwt` + `bcryptjs` · `@nestjs/throttler` · Vitest.

## Invariantes duras

Si una HU parece pedir romper una, **para y dilo**.

1. **Enlace.** `meetingLink` cifrado (AES-256-GCM). Se revela solo con `Booking` `CONFIRMED` y desde
   `scheduledAt − 30 min`; el profesor dueño lo ve siempre. Fuera de eso **el campo no viaja**. Nunca
   en listados. Aula `CANCELLED`: no se revela a nadie.
2. **Cupos.** Toda mutación de reserva, en transacción que empieza con `SELECT … FOR UPDATE` sobre el
   aula. `currentBookings` solo se toca ahí.
3. **Cancelación.** Hasta 60 min antes, en la misma transacción que libera el cupo. La fila pasa a
   `CANCELLED`; **nunca se borra**.
4. **Sin solapamiento.** Validado **dentro** de la transacción.
5. **Tiempo.** `scheduledAt` es `timestamptz` UTC; toda comparación, en el servidor.

Detalle (SQL, índice parcial, errores): `reglas-reservas.md` — léelo **solo** si tocas `bookings/`
o la lógica de cupos de `classrooms/`.

## Convenciones

- **Controller → Service → Prisma**, sin repositorios. Controller valida el DTO y delega; toda la
  lógica en el service.
- Auth global; rutas públicas con `@Public()`; roles con `@Roles(...)`. El alcance sale del token,
  nunca de un parámetro que nombre a otro usuario.
- Respuestas en `ApiResponse<T>`; errores con `code` estable de `ApiErrorCode`. Detalle en
  `contrato-api.md` — solo si creas un endpoint, DTO o modelo nuevo.
- Entorno: solo en `config/env.schema.ts` (+ `.env.example`). Falta una obligatoria → no arranca.
- Seguridad y tokens ya resueltos (`AUTH_FLOW.md`): no se reimplementan.
- Recordatorios por cron idempotente con las marcas `reminder24hSentAt` / `reminder30mSentAt`.

## Prohibido

Mutar `currentBookings` fuera de la transacción · borrar `bookings` · devolver `meetingLink` fuera
de la ventana · decidir permisos en el frontend · secretos o enlace en claro o en logs · editar una
migración ya aplicada · un `catch` que se trague un error de dominio y responda 200.

Si tocas `bookings`, el test de concurrencia (dos transacciones por el último cupo) es obligatorio.
