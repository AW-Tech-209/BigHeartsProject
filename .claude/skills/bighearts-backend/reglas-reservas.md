# Reservas, cupos y ventana de acceso — especificación

Todo lo de este archivo es lógica de servidor. El frontend no decide nada de esto.

## 1. La transacción de reserva

El caso que hay que ganar: dos estudiantes piden el último cupo en el mismo milisegundo. Tiene que
haber **exactamente un ganador**.

```sql
BEGIN;
  SELECT current_bookings, max_students, status, scheduled_at, duration_minutes
    FROM classrooms
   WHERE id = $classroomId
     FOR UPDATE;                     -- serializa a los competidores aquí

  -- 1. status debe ser PUBLISHED           → si no, CLASSROOM_NOT_BOOKABLE
  -- 2. scheduled_at debe estar en el futuro → si no, CLASSROOM_NOT_BOOKABLE
  -- 3. current_bookings < max_students      → si no, CLASSROOM_FULL
  -- 4. sin reserva CONFIRMED del mismo estudiante solapada → si no, BOOKING_OVERLAP

  INSERT INTO bookings (student_id, classroom_id, status)
  VALUES ($studentId, $classroomId, 'CONFIRMED');

  UPDATE classrooms
     SET current_bookings = current_bookings + 1
   WHERE id = $classroomId;
COMMIT;
```

Con Prisma: `prisma.$transaction(async (tx) => { … })` y el `FOR UPDATE` mediante
`tx.$queryRaw` sobre `classrooms`. El bloqueo tiene que ser **la primera sentencia**: si validas
antes de bloquear, la validación es papel mojado.

**Las cuatro comprobaciones van dentro del bloqueo.** Ninguna sirve fuera.

## 2. La transacción de cancelación

```sql
BEGIN;
  SELECT … FROM classrooms WHERE id = $classroomId FOR UPDATE;

  -- now() < scheduled_at - CANCELLATION_WINDOW_MINUTES → si no, CANCELLATION_WINDOW_CLOSED
  -- la reserva debe estar CONFIRMED y ser del propio estudiante → si no, BOOKING_NOT_FOUND

  UPDATE bookings SET status = 'CANCELLED', cancelled_at = now() WHERE id = $bookingId;
  UPDATE classrooms SET current_bookings = current_bookings - 1 WHERE id = $classroomId;
COMMIT;
```

La fila **no se borra nunca**: el historial del estudiante muestra "cancelada" y eso es información
que el producto promete.

Cuando el **profesor** cancela un aula: `Classroom.status = CANCELLED`, todas las reservas
`CONFIRMED` pasan a `CANCELLED`, y sale un email a cada estudiante afectado. Todo en una
transacción.

## 3. El índice único parcial

```sql
CREATE UNIQUE INDEX bookings_active_uniq
    ON bookings (student_id, classroom_id)
 WHERE status = 'CONFIRMED';
```

**Parcial, no total.** Un índice total sobre `(student_id, classroom_id)` impediría que un
estudiante que canceló volviera a reservar esa misma clase, porque la fila cancelada seguiría
ocupando el índice. Es una red de seguridad por si la lógica de aplicación falla; la garantía
primaria es la transacción.

En Prisma se declara con `@@unique` + una migración manual que añada el `WHERE`, porque Prisma no
modela índices parciales en el schema. **Documenta esa migración en su propio comentario.**

## 4. No solapamiento

Dos reservas se solapan si sus intervalos `[scheduledAt, scheduledAt + durationMinutes)` se cruzan.
La comprobación, dentro de la transacción:

```
existe alguna reserva CONFIRMED del estudiante cuya aula cumpla
  nueva.inicio < existente.fin  AND  existente.inicio < nueva.fin
```

Ojo con los bordes: una clase que termina a las 18:00 y otra que empieza a las 18:00 **no** se
solapan. El intervalo es cerrado por la izquierda y abierto por la derecha.

## 5. La ventana de acceso al enlace

| Aspecto             | Regla                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cifrado             | AES-256-GCM con `MEETING_LINK_KEY`. Se guarda IV + tag + ciphertext. Nunca en claro.                                                                |
| Profesor dueño      | Lo ve siempre, en cualquier momento.                                                                                                                |
| Estudiante          | Solo con `Booking.status = CONFIRMED`.                                                                                                              |
| Ventana             | Desde `scheduledAt − ACCESS_WINDOW_MINUTES` (30) hasta `scheduledAt + durationMinutes`.                                                             |
| Fuera de la ventana | **El campo se omite** de la respuesta. Ni cifrado, ni vacío, ni escondido en otro campo — el navegador no debe tener nunca el dato antes de tiempo. |
| Aula cancelada      | Nunca se revela, aunque haya reserva confirmada.                                                                                                    |

El descifrado ocurre **solo** al serializar la respuesta de un usuario autorizado dentro de la
ventana. No se descifra "por si acaso" al leer el aula.

## 6. Estados: de la BD a la pantalla

Los nueve estados que pinta `<EstadoAula>` (skill `bighearts-ui`) no son columnas: se **derivan**.
Orden de evaluación, primer match gana:

| #   | Estado                 | Condición                                                                  |
| --- | ---------------------- | -------------------------------------------------------------------------- |
| 1   | `pendiente-aprobacion` | El que mira es el profesor y su `User.status = PENDING`.                   |
| 2   | `cancelada`            | `Classroom.status = CANCELLED`.                                            |
| 3   | `finalizada`           | `Classroom.status = COMPLETED` o `now ≥ scheduledAt + durationMinutes`.    |
| 4   | `en-curso`             | `scheduledAt ≤ now < scheduledAt + durationMinutes`.                       |
| 5   | `acceso-abierto`       | Mi reserva está `CONFIRMED` y `now ≥ scheduledAt − ACCESS_WINDOW_MINUTES`. |
| 6   | `reservada`            | Mi reserva está `CONFIRMED`.                                               |
| 7   | `llena`                | `currentBookings ≥ maxStudents`.                                           |
| 8   | `ultimos-cupos`        | `maxStudents − currentBookings ≤ 3`.                                       |
| 9   | `disponible`           | Cualquier otro caso.                                                       |

La función derivadora vive en `@academia/types` y la usan las dos apps, para que no puedan
discrepar. Que el frontend pinte `acceso-abierto` **no** le da acceso al enlace: eso lo decide el
servidor (§5), siempre.

## 7. Códigos de error de este dominio

Añádelos a `ApiErrorCode` en `@academia/types` cuando implementes cada uno.

| Código                       | Cuándo                                            | HTTP |
| ---------------------------- | ------------------------------------------------- | ---- |
| `CLASSROOM_FULL`             | Sin cupos al intentar reservar.                   | 409  |
| `CLASSROOM_NOT_BOOKABLE`     | Aula no publicada, cancelada o ya empezada.       | 409  |
| `BOOKING_OVERLAP`            | El estudiante ya tiene una clase que se solapa.   | 409  |
| `BOOKING_ALREADY_EXISTS`     | Ya tiene reserva `CONFIRMED` en esa aula.         | 409  |
| `BOOKING_NOT_FOUND`          | La reserva no existe o no es suya.                | 404  |
| `CANCELLATION_WINDOW_CLOSED` | Intenta cancelar demasiado tarde.                 | 409  |
| `MEETING_LINK_NOT_AVAILABLE` | Pide el enlace fuera de la ventana o sin reserva. | 403  |

El mensaje que acompaña a cada código lo escribe el frontend según el microcopy del skill
`bighearts-ui` (literal, sin disculpas, con la acción siguiente). El backend manda un mensaje
legible pero el cliente **no lo parsea**: decide por el `code`.

## 8. Tests obligatorios

Cualquier HU que toque `bookings` no está terminada sin:

1. **Concurrencia** — dos transacciones simultáneas sobre el último cupo: una gana, la otra recibe
   `CLASSROOM_FULL`, y `currentBookings` acaba exactamente en `maxStudents`.
2. **Cancelar y re-reservar** — el mismo estudiante cancela y vuelve a reservar la misma aula sin
   chocar con el índice.
3. **Borde de la ventana** — el enlace no viaja a `scheduledAt − 31 min` y sí a `− 29 min`.
4. **Solapamiento en el borde** — dos clases consecutivas que se tocan (18:00 fin / 18:00 inicio)
   **sí** se pueden reservar las dos.
