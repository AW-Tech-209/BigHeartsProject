import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  type Classroom,
  CLASSROOMS_PAGE_SIZE_DEFAULT,
  ClassroomStatus,
  type ListClassroomsResponse,
  MeetingProvider,
  UserRole,
  UserStatus,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { insufficientRole } from '../auth/auth.errors';
import { PrismaService } from '../prisma/prisma.service';
import { toClassroomListItem, toPublicClassroom } from './classroom.mapper';
import { teacherNotActive, teacherProfileNotFound } from './classrooms.errors';
import type { CreateClassroomDto } from './dto/create-classroom.dto';
import type { ListClassroomsDto } from './dto/list-classrooms.dto';
import { MeetingLinkCipher } from './meeting-link.cipher';

@Injectable()
export class ClassroomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingLinks: MeetingLinkCipher,
  ) {}

  /**
   * Crea un aula a nombre del profesor autenticado (HU-201).
   *
   * `teacher` viene del token, y ese es el único origen posible del dueño: el
   * DTO no declara `teacherId`, así que el cuerpo no tiene forma de nombrar a
   * otra persona.
   */
  async createClassroom(teacher: AuthenticatedUser, input: CreateClassroomDto): Promise<Classroom> {
    await this.assertPuedeCrearAulas(teacher.id);

    const classroom = await this.prisma.classroom.create({
      data: {
        teacherId: teacher.id,
        title: input.title,
        description: input.description,
        level: input.level,
        maxStudents: input.maxStudents,
        // Prisma lo escribe en una columna `timestamptz`: la cadena ISO lleva
        // zona explícita (lo garantiza el DTO), así que el instante se conserva
        // sea cual sea la zona del servidor (§4.7).
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        // El dato más sensible del producto no toca la BD en claro (§4.1).
        meetingLink: this.meetingLinks.encrypt(input.meetingLink),

        // Los tres campos que decide el servidor. Se escriben EXPLÍCITAMENTE
        // aunque el esquema ya los tenga como default: así el valor con el que
        // nace un aula se lee aquí, y un cambio de default en una migración
        // futura no altera en silencio el comportamiento de este endpoint.
        meetingProvider: MeetingProvider.MANUAL,
        status: ClassroomStatus.PUBLISHED,
        currentBookings: 0,
      },
    });

    return toPublicClassroom(classroom);
  }

  /**
   * Catálogo de aulas disponibles (HU-203, A1–A4). Sin `@Roles`: la ve
   * cualquier usuario autenticado.
   *
   * Solo lectura: a diferencia de `createClassroom`, no hay
   * `SELECT … FOR UPDATE` porque nada se muta aquí (§4.2 solo lo exige para
   * la transacción que escribe `currentBookings`).
   */
  async listClassrooms(query: ListClassroomsDto): Promise<ListClassroomsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;

    // `scheduledAt` aparece dos veces a propósito: como cláusulas separadas
    // del array `AND`, no como dos claves del mismo objeto (que se pisarían
    // entre sí). Así "excluir lo ya pasado" y el rango desde/hasta se
    // combinan sin que uno tape al otro.
    const where: Prisma.ClassroomWhereInput = {
      AND: [
        { status: ClassroomStatus.PUBLISHED },
        // A2: fuera también lo que ya pasó, no solo lo CANCELLED — `COMPLETED`
        // no tiene escritor todavía (D16), así que filtrar solo por estado
        // dejaría clases viejas en la lista.
        { scheduledAt: { gt: new Date() } },
        ...(query.level ? [{ level: query.level }] : []),
        ...(query.desde ? [{ scheduledAt: { gte: new Date(query.desde) } }] : []),
        ...(query.hasta ? [{ scheduledAt: { lte: new Date(query.hasta) } }] : []),
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        include: { teacher: { select: { firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.classroom.count({ where }),
    ]);

    return {
      items: rows.map((row) => toClassroomListItem(row, row.teacher)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * El profesor tiene que estar `ACTIVE` para publicar clases
   * (`ARQUITECTURA.md` §4.5).
   *
   * **El estado se lee de la BD, no del token, y esa es toda la razón de que
   * este método exista.** El access token lleva `role` y `status`, pero es una
   * foto de hasta 15 minutos: un profesor suspendido hace cinco minutos sigue
   * presentando un token que dice `ACTIVE`, y con él publicaría aulas que otros
   * pueden reservar. Las 15 000 consultas ahorradas no valen esa ventana.
   *
   * El `role` se revisa aquí por lo mismo, aunque el `RolesGuard` ya lo haya
   * mirado: el guard decide con el token, esto decide con la fila.
   */
  private async assertPuedeCrearAulas(teacherId: string): Promise<void> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true, status: true },
    });

    if (!teacher) {
      throw teacherProfileNotFound();
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw insufficientRole();
    }

    if (teacher.status !== UserStatus.ACTIVE) {
      throw teacherNotActive(teacher.status as UserStatus);
    }
  }
}
