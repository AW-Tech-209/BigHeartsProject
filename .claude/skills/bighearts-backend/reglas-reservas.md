# Reservas, cupos y enlace — especificación

Todo es lógica de servidor. Códigos de error: catálogo `ApiErrorCode` en `@academia/types`.

## Reservar

Dos estudiantes por el último cupo en el mismo instante → **exactamente un ganador**.

```sql
BEGIN;
  SELECT current_bookings, max_students, status, scheduled_at, duration_minutes
    FROM classrooms WHERE id = $id FOR UPDATE;   -- primera sentencia, siempre
  -- no publicada, cancelada o ya empezada → CLASSROOM_NOT_BOOKABLE
  -- current_bookings >= max_students       → CLASSROOM_FULL
  -- ya tiene CONFIRMED en esa aula         → BOOKING_ALREADY_EXISTS
  -- se solapa con otra CONFIRMED suya      → BOOKING_OVERLAP
  INSERT INTO bookings (...) VALUES (..., 'CONFIRMED');
  UPDATE classrooms SET current_bookings = current_bookings + 1 WHERE id = $id;
COMMIT;
```

Prisma: `prisma.$transaction(async tx => …)` con el `FOR UPDATE` vía `tx.$queryRaw`. Validar antes
de bloquear no sirve de nada.

## Cancelar

Mismo bloqueo. Fuera de plazo → `CANCELLATION_WINDOW_CLOSED`; no es suya o no está `CONFIRMED` →
`BOOKING_NOT_FOUND`. Pasa a `CANCELLED` con `cancelledAt` y decrementa el contador. **Nunca se
borra.** Si el profesor cancela el aula: aula y reservas `CONFIRMED` a `CANCELLED` en una
transacción, y aviso a cada estudiante.

## Índice único parcial

`UNIQUE (student_id, classroom_id) WHERE status = 'CONFIRMED'`. Parcial para que quien canceló
pueda volver a reservar. Prisma no lo modela: va en SQL en la migración, **sin `@@unique` en el
schema** (el CI comprueba que no haya deriva).

## Solapamiento

`nueva.inicio < existente.fin AND existente.inicio < nueva.fin`. Intervalo cerrado a la izquierda y
abierto a la derecha: una clase que acaba a las 18:00 y otra que empieza a las 18:00 no se solapan.

## Enlace

Cifrado AES-256-GCM (`MEETING_LINK_KEY`). Lo ve el profesor dueño siempre; el estudiante con
reserva `CONFIRMED` desde `scheduledAt − 30 min` hasta el final. Fuera de eso **la clave no se
añade al objeto** (ni vacía ni cifrada). Aula `CANCELLED`: nadie. Solo lo devuelve
`GET /classrooms/:id`, decidido en un único método (`revelarElEnlace()`). Se descifra solo al
serializar para quien tiene derecho.

## Estados

Los 9 estados de UI se derivan con `derivarEstadoAula()` de `@academia/types`, que usan las dos
apps. No se duplica esa lógica.

## Tests obligatorios si tocas `bookings`

1. Concurrencia: dos transacciones por el último cupo → una gana, `currentBookings = maxStudents`.
2. Cancelar y volver a reservar la misma aula.
3. Borde de la ventana: sin enlace a −31 min, con enlace a −29 min.
4. Clases que se tocan (18:00 / 18:00) se pueden reservar las dos.
