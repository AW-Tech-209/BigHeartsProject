import { Injectable, Logger } from '@nestjs/common';
import { ClassroomStatus, type CreateBookingResponse } from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import {
  type Notification,
  NotificationService,
  NotificationType,
} from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { seSolapan } from '../classrooms/coherencia-temporal.rules';
import { classroomNotFound } from '../classrooms/classrooms.errors';
import { toPublicBooking } from './booking.mapper';
import {
  bookingAlreadyExists,
  bookingOverlap,
  classroomFull,
  classroomNotBookable,
} from './bookings.errors';
import type { CreateBookingDto } from './dto/create-booking.dto';

/** La fila del aula tal y como sale del `SELECT … FOR UPDATE` (§4.2). */
interface AulaBloqueada {
  status: string;
  current_bookings: number;
  max_students: number;
  scheduled_at: Date;
  duration_minutes: number;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * `POST /bookings` (HU-301). Solo `STUDENT` (comprobado por el `RolesGuard`
   * a partir de `@Roles`, no aquí).
   *
   * Toda la lógica vive dentro de UNA transacción que bloquea la fila del aula
   * con `SELECT … FOR UPDATE` como primera sentencia (`reglas-reservas.md`
   * §1): las cuatro comprobaciones —aula reservable, cupo, reserva duplicada,
   * solapamiento— se hacen sobre esa fila bloqueada, así que dos estudiantes
   * pidiendo el último cupo a la vez quedan serializados y exactamente uno
   * gana. Validarlas antes de bloquear dejaría la carrera abierta.
   */
  async createBooking(
    student: AuthenticatedUser,
    dto: CreateBookingDto,
  ): Promise<CreateBookingResponse> {
    const creada = await this.prisma.$transaction(async (tx) => {
      const filas = await tx.$queryRaw<AulaBloqueada[]>`
        SELECT status, current_bookings, max_students, scheduled_at, duration_minutes
          FROM classrooms
         WHERE id = ${dto.classroomId}::uuid
           FOR UPDATE
      `;
      const aula = filas[0];

      if (!aula) {
        throw classroomNotFound();
      }

      const ahora = new Date();

      // No PUBLISHED (nunca lo estuvo, o CANCELLED), o ya empezó: no hay nada
      // que reservar. Va antes que el cupo — un aula cancelada sin cupo debe
      // decir "no admite reservas", no "está llena".
      if (aula.status !== ClassroomStatus.PUBLISHED || aula.scheduled_at <= ahora) {
        throw classroomNotBookable();
      }

      if (aula.current_bookings >= aula.max_students) {
        throw classroomFull();
      }

      // Duplicada antes que solapamiento: la misma aula solapa consigo misma,
      // y el estudiante necesita el mensaje específico («ya tienes esta
      // clase»), no el genérico de choque de horario.
      const reservaExistente = await tx.booking.findFirst({
        where: { studentId: student.id, classroomId: dto.classroomId, status: 'CONFIRMED' },
        select: { id: true },
      });

      if (reservaExistente) {
        throw bookingAlreadyExists();
      }

      const reservasVigentes = await tx.booking.findMany({
        where: { studentId: student.id, status: 'CONFIRMED' },
        select: { classroom: { select: { scheduledAt: true, durationMinutes: true } } },
      });

      const nuevoIntervalo = {
        scheduledAt: aula.scheduled_at,
        durationMinutes: aula.duration_minutes,
      };
      const solapa = reservasVigentes.some(({ classroom }) => seSolapan(nuevoIntervalo, classroom));

      if (solapa) {
        throw bookingOverlap();
      }

      const booking = await tx.booking.create({
        data: { studentId: student.id, classroomId: dto.classroomId, status: 'CONFIRMED' },
      });

      // El contador solo se muta aquí, dentro de la misma transacción que crea
      // la reserva (`ARQUITECTURA.md` §4.2). Nunca en un `update` suelto.
      await tx.classroom.update({
        where: { id: dto.classroomId },
        data: { currentBookings: { increment: 1 } },
      });

      return booking;
    });

    await this.notifyBookingConfirmed(student);

    return { booking: toPublicBooking(creada) };
  }

  /**
   * Avisa al estudiante por el puerto `NotificationService` (D29). Corre
   * DESPUÉS de que la transacción confirme: la reserva ya está escrita, así
   * que un fallo de notificación no puede tumbarla — mismo criterio que
   * `AdminService.notify()` con la aprobación de profesores.
   */
  private async notifyBookingConfirmed(student: AuthenticatedUser): Promise<void> {
    const notification: Notification = {
      type: NotificationType.BOOKING_CONFIRMED,
      recipient: { email: student.email, firstName: await this.firstNameDe(student.id) },
    };

    try {
      await this.notifications.notify(notification);
    } catch (error) {
      this.logger.error(
        `No se pudo notificar ${notification.type} a ${notification.recipient.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async firstNameDe(studentId: string): Promise<string> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true },
    });

    return student?.firstName ?? '';
  }
}
