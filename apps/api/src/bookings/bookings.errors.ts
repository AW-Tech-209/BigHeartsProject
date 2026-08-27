import { ConflictException } from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';

/**
 * Fábricas de las excepciones de dominio de reservas (HU-301,
 * `reglas-reservas.md` §7). Un `classroomId` que no existe usa
 * `classroomNotFound()` de `classrooms.errors.ts` tal cual: es el mismo hecho
 * lo pida quien lo pida.
 */

/** El aula ya tiene tantas reservas `CONFIRMED` como `maxStudents` (AC1). */
export const classroomFull = (): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.CLASSROOM_FULL,
    message: 'Ya no quedan cupos en esta clase.',
  });

/**
 * El aula no está `PUBLISHED`, está `CANCELLED`, o ya empezó (T4). Es 409: el
 * aula existe, lo que falta es la ventana para reservarla.
 */
export const classroomNotBookable = (): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.CLASSROOM_NOT_BOOKABLE,
    message: 'Esta clase ya no admite reservas.',
  });

/** El estudiante ya tiene una reserva `CONFIRMED` en esa aula (AC2). */
export const bookingAlreadyExists = (): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.BOOKING_ALREADY_EXISTS,
    message: 'Ya tienes una reserva en esta clase.',
  });

/**
 * La nueva reserva se solapa con otra `CONFIRMED` del mismo estudiante (AC2,
 * `ARQUITECTURA.md` §4.4).
 */
export const bookingOverlap = (): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.BOOKING_OVERLAP,
    message: 'Ya tienes otra clase reservada en ese horario.',
  });
