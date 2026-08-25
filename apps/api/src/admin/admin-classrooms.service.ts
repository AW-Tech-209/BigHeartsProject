import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { type AdminClassroomsResponse, CLASSROOMS_PAGE_SIZE_DEFAULT } from '@academia/types';

import { toClassroomListItem } from '../classrooms/classroom.mapper';
import { PrismaService } from '../prisma/prisma.service';
import type { ListAdminClassroomsDto } from './dto/list-admin-classrooms.dto';

@Injectable()
export class AdminClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Todas las aulas de todos los profesores (HU-210, T3): publicadas,
   * canceladas y pasadas, sin exclusión por defecto. A diferencia del
   * catálogo (`ClassroomsService.listClassrooms`), aquí no hay `status:
   * PUBLISHED` ni `scheduledAt: { gt: ahora }` implícitos — el admin
   * supervisa, no descubre.
   *
   * Orden `scheduledAt` descendente (T4, AC6): al supervisar interesa
   * primero lo más reciente, al revés que el catálogo.
   *
   * `meetingLink` no viaja: `toClassroomListItem` nunca lo copia (decisión 2
   * de la HU, AC4).
   */
  async listAll(query: ListAdminClassroomsDto): Promise<AdminClassroomsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;

    const where: Prisma.ClassroomWhereInput = {
      AND: [
        ...(query.teacherId ? [{ teacherId: query.teacherId }] : []),
        ...(query.status ? [{ status: query.status }] : []),
        ...(query.desde ? [{ scheduledAt: { gte: new Date(query.desde) } }] : []),
        ...(query.hasta ? [{ scheduledAt: { lte: new Date(query.hasta) } }] : []),
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        include: { teacher: { select: { firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'desc' },
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
}
