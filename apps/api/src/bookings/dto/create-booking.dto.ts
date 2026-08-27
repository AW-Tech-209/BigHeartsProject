import type { CreateBookingInput } from '@academia/types';
import { IsUUID } from 'class-validator';

/** Cuerpo de `POST /bookings` (HU-301). `studentId` sale del token, no de aquí. */
export class CreateBookingDto implements CreateBookingInput {
  @IsUUID(undefined, { message: 'El id del aula no tiene forma de UUID.' })
  classroomId!: string;
}
