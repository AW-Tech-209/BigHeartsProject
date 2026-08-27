import type { Booking as PrismaBooking } from '@prisma/client';
import { type Booking, type BookingStatus } from '@academia/types';

/** Convierte una fila de Prisma en el tipo público de `@academia/types`. */
export function toPublicBooking(booking: PrismaBooking): Booking {
  return {
    id: booking.id,
    studentId: booking.studentId,
    classroomId: booking.classroomId,
    status: booking.status as BookingStatus,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
