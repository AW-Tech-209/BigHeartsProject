import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  BookingStatus,
  ClassroomStatus,
  type CommunicationPreference,
  type RecuentoComunicacionGrupo,
  type ResumenPanelAdmin,
  type ResumenPanelEstudiante,
  type ResumenPanelProfesor,
  type ResumenPanelResponse,
  UserRole,
  UserStatus,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { puedeCancelarse } from '../bookings/cancelacion.rules';
import { derivarAccesoAlEnlace } from '../classrooms/acceso-enlace.rules';
import { toClassroomListItem } from '../classrooms/classroom.mapper';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';

const DIA_MS = 24 * 60 * 60 * 1000;

const CLASSROOM_CON_PROFESOR = {
  teacher: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ClassroomInclude;

/** Inscrito de verdad: la reserva no está cancelada. */
const NO_CANCELADA = { not: BookingStatus.CANCELLED } as const;

@Injectable()
export class PanelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * `GET /panel/resumen` (HU-502). Una sola vista, un endpoint: la forma sale
   * del rol de quien pregunta y el alcance del token, nunca de un parámetro
   * (§4.8) — como `GET /historial` (HU-404).
   */
  async resumen(viewer: AuthenticatedUser): Promise<ResumenPanelResponse> {
    switch (viewer.role) {
      case UserRole.TEACHER:
        return this.resumenProfesor(viewer);
      case UserRole.ADMIN:
        return this.resumenAdmin();
      default:
        return this.resumenEstudiante(viewer);
    }
  }

  private async resumenEstudiante(student: AuthenticatedUser): Promise<ResumenPanelEstudiante> {
    const ahora = new Date();
    // «Próxima» corta en el FIN de la clase: una clase en curso sigue siendo la
    // próxima del estudiante —es a la que tiene que entrar ahora—, no una pasada.
    const reservaProxima: Prisma.BookingWhereInput = {
      studentId: student.id,
      status: BookingStatus.CONFIRMED,
      classroom: { status: { not: ClassroomStatus.CANCELLED }, endsAt: { gt: ahora } },
    };

    const [perfil, proxima, reservasActivas] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: student.id },
        select: { communicationPreference: true },
      }),
      this.prisma.booking.findFirst({
        where: reservaProxima,
        orderBy: { classroom: { scheduledAt: 'asc' } },
        include: { classroom: { include: CLASSROOM_CON_PROFESOR } },
      }),
      this.prisma.booking.count({ where: reservaProxima }),
    ]);

    const preferencia = perfil?.communicationPreference ?? null;

    // «Con cupo» compara `currentBookings` contra `maxStudents`, dos columnas
    // que Prisma no filtra entre sí: se traen las candidatas —futuras,
    // publicadas y con el modo— y el filtro de cupo se hace en memoria.
    const conElModo = preferencia
      ? await this.prisma.classroom.findMany({
          where: {
            status: ClassroomStatus.PUBLISHED,
            scheduledAt: { gt: ahora },
            communicationModes: { has: preferencia },
          },
          select: { maxStudents: true, currentBookings: true },
        })
      : [];
    const clasesQueCoinciden = conElModo.filter(
      (aula) => aula.currentBookings < aula.maxStudents,
    ).length;

    let proximaClase = null;
    if (proxima) {
      const acceso = derivarAccesoAlEnlace(proxima.classroom, {
        esDueno: false,
        tieneReservaConfirmada: true,
        ahora,
        accessWindowMinutes: this.config.accessWindowMinutes,
      });
      proximaClase = toClassroomListItem(
        proxima.classroom,
        proxima.classroom.teacher,
        BookingStatus.CONFIRMED,
        proxima.id,
        puedeCancelarse(
          proxima.classroom.scheduledAt,
          ahora,
          this.config.cancellationWindowMinutes,
        ),
        acceso.estado,
        acceso.abreEn?.toISOString() ?? null,
      );
    }

    return {
      rol: UserRole.STUDENT,
      proximaClase,
      reservasActivas,
      clasesQueCoinciden,
      sinPreferencia: preferencia === null,
    };
  }

  private async resumenProfesor(teacher: AuthenticatedUser): Promise<ResumenPanelProfesor> {
    const ahora = new Date();

    const [proximaRow, asistenciaSinMarcar, inscritos] = await Promise.all([
      this.prisma.classroom.findFirst({
        where: {
          teacherId: teacher.id,
          status: { not: ClassroomStatus.CANCELLED },
          // Incluye la clase en curso: sigue siendo la «próxima» del profesor.
          endsAt: { gt: ahora },
        },
        orderBy: { scheduledAt: 'asc' },
        include: CLASSROOM_CON_PROFESOR,
      }),
      // Clases suyas ya terminadas (`endsAt <= ahora`) con al menos una reserva
      // CONFIRMED sin marcar — la deuda de asistencia (D39).
      this.prisma.classroom.count({
        where: {
          teacherId: teacher.id,
          status: { not: ClassroomStatus.CANCELLED },
          endsAt: { lte: ahora },
          bookings: { some: { status: BookingStatus.CONFIRMED } },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          status: NO_CANCELADA,
          classroom: {
            teacherId: teacher.id,
            status: { not: ClassroomStatus.CANCELLED },
            endsAt: { gt: ahora },
          },
        },
        select: { student: { select: { communicationPreference: true } } },
      }),
    ]);

    return {
      rol: UserRole.TEACHER,
      proximaClase: proximaRow ? toClassroomListItem(proximaRow, proximaRow.teacher) : null,
      asistenciaSinMarcar,
      comunicacionDelGrupo: recuentoPorModo(
        inscritos.map(
          (inscrito) => inscrito.student.communicationPreference as CommunicationPreference | null,
        ),
      ),
    };
  }

  private async resumenAdmin(): Promise<ResumenPanelAdmin> {
    const ahora = new Date();
    const inicioHoy = new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()),
    );
    const finHoy = new Date(inicioHoy.getTime() + DIA_MS);
    const finSemana = new Date(ahora.getTime() + 7 * DIA_MS);

    const [profesoresPendientes, clasesHoy, clasesEnCurso, ocupacion] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.TEACHER, status: UserStatus.PENDING },
      }),
      this.prisma.classroom.count({
        where: {
          status: { not: ClassroomStatus.CANCELLED },
          scheduledAt: { gte: inicioHoy, lt: finHoy },
        },
      }),
      // Empezada (`scheduledAt <= ahora`) y todavía sin terminar (`endsAt > ahora`).
      this.prisma.classroom.count({
        where: {
          status: { not: ClassroomStatus.CANCELLED },
          scheduledAt: { lte: ahora },
          endsAt: { gt: ahora },
        },
      }),
      this.prisma.classroom.aggregate({
        where: { status: ClassroomStatus.PUBLISHED, scheduledAt: { gte: ahora, lt: finSemana } },
        _sum: { currentBookings: true, maxStudents: true },
      }),
    ]);

    return {
      rol: UserRole.ADMIN,
      profesoresPendientes,
      clasesHoy,
      clasesEnCurso,
      cuposReservadosSemana: ocupacion._sum.currentBookings ?? 0,
      cuposOfrecidosSemana: ocupacion._sum.maxStudents ?? 0,
    };
  }
}

function recuentoPorModo(
  preferencias: (CommunicationPreference | null)[],
): RecuentoComunicacionGrupo {
  const porModo: Partial<Record<CommunicationPreference, number>> = {};
  let sinIndicar = 0;

  for (const preferencia of preferencias) {
    if (preferencia) {
      porModo[preferencia] = (porModo[preferencia] ?? 0) + 1;
    } else {
      sinIndicar += 1;
    }
  }

  return { porModo, sinIndicar, total: preferencias.length };
}
