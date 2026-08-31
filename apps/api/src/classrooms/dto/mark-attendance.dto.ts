import { type AttendanceStatus, BookingStatus, type MarkAttendanceInput } from '@academia/types';
import { IsIn, IsUUID } from 'class-validator';

/** Cuerpo de `POST /classrooms/:id/asistencia` (HU-403). El aula sale de la ruta. */
export class MarkAttendanceDto implements MarkAttendanceInput {
  @IsUUID(undefined, { message: 'El id de la reserva no tiene forma de UUID.' })
  bookingId!: string;

  @IsIn([BookingStatus.ATTENDED, BookingStatus.NO_SHOW], {
    message: 'El estado debe ser ATTENDED o NO_SHOW.',
  })
  status!: AttendanceStatus;
}
