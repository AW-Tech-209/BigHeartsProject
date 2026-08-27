import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  type BookingStatus,
  CLASSROOMS_PAGE_SIZE_DEFAULT,
  ClassroomStatus,
  type CreateBookingResponse,
  ESTADO_TEMPORAL_POR_DEFECTO,
  EstadoTemporalAula,
  type MisReservasResponse,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import {
  type Notification,
  NotificationService,
  NotificationType,
} from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { seSolapan } from '../classrooms/coherencia-temporal.rules';
import { classroomNotFound } from '../classrooms/classrooms.errors';
import { toClassroomListItem } from '../classrooms/classroom.mapper';
import { toPublicBooking } from './booking.mapper';
import {
  bookingAlreadyExists,
  bookingOverlap,
  classroomFull,
  classroomNotBookable,
} from './bookings.errors';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { ListMisReservasDto } from './dto/list-mis-reservas.dto';

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

  /**
   * `GET /bookings/mias` (HU-302). Copia la forma de
   * `ClassroomsService.listMisAulas` (HU-207): mismo filtro disjunto D24,
   * mismo orden, misma paginación de dos listas concatenadas en `todas`.
   *
   * **El `studentId` sale del token**, igual que el `teacherId` de «Mis
   * aulas» (§4.8, regla 3): el DTO no lo declara, así que no hay forma de
   * pedir las reservas de otro.
   *
   * `meetingLink` no viaja: `toClassroomListItem` nunca lo copia.
   */
  async listMisReservas(
    student: AuthenticatedUser,
    query: ListMisReservasDto,
  ): Promise<MisReservasResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;
    const estado = query.estado ?? ESTADO_TEMPORAL_POR_DEFECTO;
    const ahora = new Date();
    const skip = (page - 1) * pageSize;

    const { rows, total } =
      estado === EstadoTemporalAula.TODAS
        ? await this.leerTodasMisReservas(student.id, ahora, skip, pageSize)
        : await this.leerMisReservasPorEstado(student.id, estado, ahora, skip, pageSize);

    return {
      items: rows.map((booking) =>
        toClassroomListItem(
          booking.classroom,
          booking.classroom.teacher,
          booking.status as BookingStatus,
        ),
      ),
      total,
      page,
      pageSize,
    };
  }

  private async leerMisReservasPorEstado(
    studentId: string,
    estado: Exclude<EstadoTemporalAula, EstadoTemporalAula.TODAS>,
    ahora: Date,
    skip: number,
    take: number,
  ) {
    const where = {
      [EstadoTemporalAula.PROXIMAS]: proximasDe(studentId, ahora),
      [EstadoTemporalAula.PASADAS]: pasadasDe(studentId, ahora),
      [EstadoTemporalAula.CANCELADAS]: canceladasDe(studentId),
    }[estado];

    const orderBy: Prisma.BookingOrderByWithRelationInput = {
      classroom: { scheduledAt: estado === EstadoTemporalAula.PROXIMAS ? 'asc' : 'desc' },
    };

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy,
        skip,
        take,
        include: BOOKING_CLASSROOM_INCLUDE,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { rows, total };
  }

  private async leerTodasMisReservas(studentId: string, ahora: Date, skip: number, take: number) {
    const whereProximas = proximasDe(studentId, ahora);
    const whereHistorial = historialDe(studentId, ahora);

    const [totalProximas, totalHistorial] = await Promise.all([
      this.prisma.booking.count({ where: whereProximas }),
      this.prisma.booking.count({ where: whereHistorial }),
    ]);

    const proximas =
      skip < totalProximas
        ? await this.prisma.booking.findMany({
            where: whereProximas,
            orderBy: { classroom: { scheduledAt: 'asc' } },
            skip,
            take,
            include: BOOKING_CLASSROOM_INCLUDE,
          })
        : [];

    const huecoRestante = take - proximas.length;
    const historial =
      huecoRestante > 0
        ? await this.prisma.booking.findMany({
            where: whereHistorial,
            orderBy: { classroom: { scheduledAt: 'desc' } },
            skip: Math.max(skip - totalProximas, 0),
            take: huecoRestante,
            include: BOOKING_CLASSROOM_INCLUDE,
          })
        : [];

    return { rows: [...proximas, ...historial], total: totalProximas + totalHistorial };
  }
}

const BOOKING_CLASSROOM_INCLUDE = {
  classroom: { include: { teacher: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.BookingInclude;

/**
 * Los tres grupos disjuntos de D24, sobre la reserva del estudiante en vez
 * del aula del profesor: el estado gana sobre la fecha, así que una clase
 * cancelada cuenta como `canceladas` aunque sea futura.
 */
function proximasDe(studentId: string, ahora: Date): Prisma.BookingWhereInput {
  return {
    studentId,
    classroom: { status: { not: ClassroomStatus.CANCELLED }, scheduledAt: { gt: ahora } },
  };
}

function pasadasDe(studentId: string, ahora: Date): Prisma.BookingWhereInput {
  return {
    studentId,
    classroom: { status: { not: ClassroomStatus.CANCELLED }, scheduledAt: { lte: ahora } },
  };
}

function canceladasDe(studentId: string): Prisma.BookingWhereInput {
  return { studentId, classroom: { status: ClassroomStatus.CANCELLED } };
}

function historialDe(studentId: string, ahora: Date): Prisma.BookingWhereInput {
  return {
    studentId,
    classroom: { OR: [{ status: ClassroomStatus.CANCELLED }, { scheduledAt: { lte: ahora } }] },
  };
}
