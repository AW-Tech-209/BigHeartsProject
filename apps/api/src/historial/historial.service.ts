import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  BookingStatus,
  CLASSROOMS_PAGE_SIZE_DEFAULT,
  ClassroomStatus,
  type HistorialEstudianteResponse,
  type HistorialProfesorResponse,
  UserRole,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { toClassroomListItem, toPublicClassroom } from '../classrooms/classroom.mapper';
import { PrismaService } from '../prisma/prisma.service';
import type { ListHistorialDto } from './dto/list-historial.dto';

const HISTORIAL_CLASSROOM_INCLUDE = {
  classroom: { include: { teacher: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.BookingInclude;

/** Reservas que cuentan como "inscrito de verdad": llegaron a tener cupo confirmado. */
const ESTADOS_INSCRITO = [BookingStatus.CONFIRMED, BookingStatus.ATTENDED, BookingStatus.NO_SHOW];

@Injectable()
export class HistorialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `GET /historial` (HU-404, D34). Una sola vista, un endpoint: la forma de
   * la respuesta sale del rol de quien pregunta, y ambos alcances salen del
   * token, nunca de un parámetro (§4.8, regla 3).
   */
  async listHistorial(
    viewer: AuthenticatedUser,
    query: ListHistorialDto,
  ): Promise<HistorialEstudianteResponse | HistorialProfesorResponse> {
    return viewer.role === UserRole.TEACHER
      ? this.listHistorialProfesor(viewer, query)
      : this.listHistorialEstudiante(viewer, query);
  }

  /**
   * Las reservas pasadas o canceladas del estudiante, con su resultado
   * (AC1). `meetingLink` no viaja: `toClassroomListItem` nunca lo copia.
   */
  private async listHistorialEstudiante(
    student: AuthenticatedUser,
    query: ListHistorialDto,
  ): Promise<HistorialEstudianteResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;
    const ahora = new Date();
    const skip = (page - 1) * pageSize;

    // "Pasada o cancelada" es lo que la convierte en historial (D34): una
    // reserva CONFIRMED de una clase futura no pertenece aquí.
    const where: Prisma.BookingWhereInput = {
      studentId: student.id,
      OR: [{ status: BookingStatus.CANCELLED }, { classroom: { scheduledAt: { lte: ahora } } }],
      ...(query.resultado && { status: query.resultado }),
      ...((query.desde || query.hasta) && {
        classroom: {
          scheduledAt: {
            ...(query.desde && { gte: new Date(query.desde) }),
            ...(query.hasta && { lte: new Date(query.hasta) }),
          },
        },
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { classroom: { scheduledAt: 'desc' } },
        skip,
        take: pageSize,
        include: HISTORIAL_CLASSROOM_INCLUDE,
      }),
      this.prisma.booking.count({ where }),
    ]);

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

  /**
   * Las aulas que el profesor ya impartió, con cuántos se inscribieron y
   * cuántos asistieron (AC2). Una `CANCELLED` nunca se impartió, así que no
   * cuenta como historial de clases dadas.
   */
  private async listHistorialProfesor(
    teacher: AuthenticatedUser,
    query: ListHistorialDto,
  ): Promise<HistorialProfesorResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;
    const ahora = new Date();
    const skip = (page - 1) * pageSize;

    // `scheduledAt` aparece en varias cláusulas del `AND`, no como claves
    // repetidas del mismo objeto (que se pisarían entre sí): así "ya
    // impartida" y el rango desde/hasta se combinan sin que uno tape al otro.
    const where: Prisma.ClassroomWhereInput = {
      teacherId: teacher.id,
      status: { not: ClassroomStatus.CANCELLED },
      AND: [
        { scheduledAt: { lte: ahora } },
        ...(query.desde ? [{ scheduledAt: { gte: new Date(query.desde) } }] : []),
        ...(query.hasta ? [{ scheduledAt: { lte: new Date(query.hasta) } }] : []),
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.classroom.count({ where }),
    ]);

    const conteos =
      rows.length > 0
        ? await this.prisma.booking.groupBy({
            by: ['classroomId', 'status'],
            where: { classroomId: { in: rows.map((row) => row.id) } },
            _count: { _all: true },
          })
        : [];

    return {
      items: rows.map((row) => ({
        ...toPublicClassroom(row),
        totalInscritos: conteos
          .filter(
            (c) => c.classroomId === row.id && ESTADOS_INSCRITO.includes(c.status as BookingStatus),
          )
          .reduce((suma, c) => suma + c._count._all, 0),
        totalAsistieron: conteos
          .filter((c) => c.classroomId === row.id && c.status === BookingStatus.ATTENDED)
          .reduce((suma, c) => suma + c._count._all, 0),
      })),
      total,
      page,
      pageSize,
    };
  }
}
