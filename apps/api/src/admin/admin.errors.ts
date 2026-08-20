import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';

/**
 * Fábricas de las excepciones de dominio de administración.
 *
 * Cada una lleva un `code` estable de @academia/types y un texto en español
 * para el administrador; el AllExceptionsFilter global las traduce al envelope
 * `ApiResponse`.
 */

/**
 * No hay ningún usuario con ese id.
 *
 * Lo emite también el pipe que valida el parámetro de la ruta: un `id` que ni
 * siquiera tiene forma de UUID no puede nombrar a nadie, así que se responde lo
 * mismo que si no existiera. La alternativa —dejarlo llegar a Prisma— provoca
 * un 500 contra una columna `@db.Uuid`, que es justo lo que el AC5 de la HU-104
 * prohíbe.
 */
export const teacherNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.USER_NOT_FOUND,
    message: 'No encontramos a ese profesor. Puede que su cuenta ya no exista.',
  });

/**
 * El usuario existe, pero el cambio de estado que se pide no es legal.
 *
 * Las únicas transiciones válidas son `PENDING → ACTIVE` y `PENDING → REJECTED`
 * sobre un usuario con rol `TEACHER` (`docs/ARQUITECTURA.md` §4.5). Aprobar a
 * un estudiante, o a un profesor que ya está activo, cae aquí.
 *
 * Es 409 y no 404 a propósito: el recurso está, lo que no está es la
 * transición. Y es 409 y no 400 porque la petición era válida cuando el
 * administrador la vio en pantalla — típicamente el estado cambió por debajo
 * (otro administrador llegó antes), y eso es un conflicto, no un error de
 * formato.
 *
 * El mensaje NO detalla el estado actual del otro usuario: quien lo lee es un
 * administrador, así que no hay fuga real, pero el texto útil aquí es el que
 * dice qué hacer —recargar—, no el que describe la fila.
 */
export const invalidStatusTransition = (): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.INVALID_STATUS_TRANSITION,
    message:
      'Esa cuenta ya no está pendiente de aprobación. Vuelve a cargar la lista para ver su estado actual.',
  });
