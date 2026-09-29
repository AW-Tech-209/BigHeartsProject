import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import {
  ApiErrorCode,
  BookingStatus,
  ProblemaClase,
  SeguimientoClase,
  UserRole,
  UserStatus,
} from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AppConfigService } from '../config/app-config.service';
import type { NotificationService } from '../notifications/notification.service';
import type { PrismaService } from '../prisma/prisma.service';
import { HistorialService } from '../historial/historial.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import type { CrearValoracionDto } from './dto/crear-valoracion.dto';
import {
  agregarValoraciones,
  dentroDeVentanaDeValoracion,
  puedeValorarReserva,
} from './valoracion.rules';

const DIA_MS = 24 * 60 * 60_000;
const ESTUDIANTE_ID = '11111111-1111-4111-8111-111111111111';
const BOOKING_ID = '33333333-3333-4333-8333-333333333333';
const estudiante: AuthenticatedUser = {
  id: ESTUDIANTE_ID,
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

describe('dentroDeVentanaDeValoracion (AC1)', () => {
  const fin = new Date('2026-09-01T12:00:00.000Z');

  it('no antes de terminar la clase', () => {
    expect(dentroDeVentanaDeValoracion(fin, new Date(fin.getTime() - 1))).toBe(false);
  });

  it('sí desde el fin exacto y hasta 7 días después', () => {
    expect(dentroDeVentanaDeValoracion(fin, fin)).toBe(true);
    expect(dentroDeVentanaDeValoracion(fin, new Date(fin.getTime() + 7 * DIA_MS))).toBe(true);
  });

  it('no pasados los 7 días', () => {
    expect(dentroDeVentanaDeValoracion(fin, new Date(fin.getTime() + 7 * DIA_MS + 1))).toBe(false);
  });
});

describe('puedeValorarReserva', () => {
  const ahora = new Date('2026-09-02T12:00:00.000Z');
  const aula = { endsAt: new Date('2026-09-01T12:00:00.000Z') };

  it('sí con reserva CONFIRMED o ATTENDED sin valoración', () => {
    for (const status of [BookingStatus.CONFIRMED, BookingStatus.ATTENDED]) {
      expect(puedeValorarReserva({ status, classroom: aula, feedback: null }, ahora)).toBe(true);
    }
  });

  it('no si ya valoró, faltó o canceló', () => {
    expect(
      puedeValorarReserva({ status: 'ATTENDED', classroom: aula, feedback: { id: 'x' } }, ahora),
    ).toBe(false);
    for (const status of [BookingStatus.NO_SHOW, BookingStatus.CANCELLED]) {
      expect(puedeValorarReserva({ status, classroom: aula, feedback: null }, ahora)).toBe(false);
    }
  });
});

describe('agregarValoraciones (AC3)', () => {
  const si = { seguimiento: SeguimientoClase.SI, problemas: [] };
  const aMedias = {
    seguimiento: SeguimientoClase.A_MEDIAS,
    problemas: [ProblemaClase.SUBTITULOS, ProblemaClase.RITMO],
  };

  it('con 2 respuestas devuelve null', () => {
    expect(agregarValoraciones([si, aMedias])).toBeNull();
  });

  it('con 3 respuestas cuenta seguimiento y problemas', () => {
    const agregado = agregarValoraciones([
      si,
      aMedias,
      { seguimiento: SeguimientoClase.NO, problemas: [ProblemaClase.SUBTITULOS] },
    ]);

    expect(agregado).toEqual({
      respuestas: 3,
      si: 1,
      aMedias: 1,
      no: 1,
      problemas: { INTERPRETE: 0, SUBTITULOS: 2, CONEXION: 0, RITMO: 1, OTRO: 0 },
    });
  });
});

function setupServicio(booking: unknown, createError?: unknown) {
  const create = vi.fn();
  if (createError) {
    create.mockRejectedValue(createError);
  } else {
    create.mockResolvedValue({});
  }
  const prisma = {
    booking: { findUnique: vi.fn().mockResolvedValue(booking) },
    classFeedback: { create },
  } as unknown as PrismaService;

  return {
    service: new BookingsService(
      prisma,
      {} as NotificationService,
      { cancellationWindowMinutes: 60, accessWindowMinutes: 10 } as unknown as AppConfigService,
    ),
    create,
  };
}

function reserva(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    studentId: ESTUDIANTE_ID,
    status: BookingStatus.ATTENDED,
    classroom: { endsAt: new Date(Date.now() - DIA_MS) },
    feedback: null,
    ...overrides,
  };
}

const dtoSi = { seguimiento: SeguimientoClase.SI } as CrearValoracionDto;

async function errorDe(promesa: Promise<unknown>) {
  try {
    await promesa;
  } catch (error) {
    const e = error as { getStatus: () => number; getResponse: () => { code: string } };
    return { status: e.getStatus(), code: e.getResponse().code };
  }
  throw new Error('Se esperaba un error.');
}

describe('BookingsService.crearValoracion (AC1)', () => {
  it('guarda la valoración de la reserva propia dentro de la ventana', async () => {
    const { service, create } = setupServicio(reserva());

    await expect(service.crearValoracion(estudiante, BOOKING_ID, dtoSi)).resolves.toEqual({
      enviada: true,
    });
    expect(create).toHaveBeenCalledWith({
      data: { bookingId: BOOKING_ID, seguimiento: 'SI', problemas: [], comentario: null },
    });
  });

  it('otro estudiante recibe 404 y nada se guarda', async () => {
    const { service, create } = setupServicio(reserva({ studentId: 'otro' }));

    expect(await errorDe(service.crearValoracion(estudiante, BOOKING_ID, dtoSi))).toEqual({
      status: 404,
      code: ApiErrorCode.BOOKING_NOT_FOUND,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('el segundo envío responde 409 FEEDBACK_ALREADY_SENT', async () => {
    const { service } = setupServicio(reserva({ feedback: { id: 'f' } }));

    expect(await errorDe(service.crearValoracion(estudiante, BOOKING_ID, dtoSi))).toEqual({
      status: 409,
      code: ApiErrorCode.FEEDBACK_ALREADY_SENT,
    });
  });

  it('dos envíos simultáneos: el índice único también responde 409', async () => {
    const duplicado = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const { service } = setupServicio(reserva(), duplicado);

    expect((await errorDe(service.crearValoracion(estudiante, BOOKING_ID, dtoSi))).code).toBe(
      ApiErrorCode.FEEDBACK_ALREADY_SENT,
    );
  });

  it('antes de que termine la clase y pasados 7 días responde 409 FEEDBACK_WINDOW_CLOSED', async () => {
    for (const endsAt of [new Date(Date.now() + 60_000), new Date(Date.now() - 8 * DIA_MS)]) {
      const { service } = setupServicio(reserva({ classroom: { endsAt } }));

      expect(await errorDe(service.crearValoracion(estudiante, BOOKING_ID, dtoSi))).toEqual({
        status: 409,
        code: ApiErrorCode.FEEDBACK_WINDOW_CLOSED,
      });
    }
  });

  it('una reserva cancelada no se valora', async () => {
    const { service } = setupServicio(reserva({ status: BookingStatus.CANCELLED }));

    expect((await errorDe(service.crearValoracion(estudiante, BOOKING_ID, dtoSi))).code).toBe(
      ApiErrorCode.FEEDBACK_WINDOW_CLOSED,
    );
  });

  it('los problemas solo se aceptan si no respondió «Sí»', async () => {
    const { service } = setupServicio(reserva());
    const conProblemas = {
      seguimiento: SeguimientoClase.SI,
      problemas: [ProblemaClase.RITMO],
    } as CrearValoracionDto;

    expect(await errorDe(service.crearValoracion(estudiante, BOOKING_ID, conProblemas))).toEqual({
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  });
});

describe('POST /bookings/:id/valoracion — autorización', () => {
  const guard = new RolesGuard(new Reflector());

  it.each([UserRole.TEACHER, UserRole.ADMIN])('responde 403 a %s', (role) => {
    const context = {
      getHandler: () => BookingsController.prototype.valorar,
      getClass: () => BookingsController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'x', email: 'u@academia.local', role, status: UserStatus.ACTIVE },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrowError(
      expect.objectContaining({ status: 403 }) as Error,
    );
  });
});

describe('historial del profesor — agregado anónimo (AC2, AC3)', () => {
  const profesor: AuthenticatedUser = {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'paula@academia.local',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
  };

  async function historialCon(respuestas: number) {
    const aula = {
      id: 'aula-1',
      teacherId: profesor.id,
      meetingLink: null,
      scheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const prisma = {
      classroom: {
        findMany: vi.fn().mockResolvedValue([aula]),
        count: vi.fn().mockResolvedValue(1),
      },
      booking: { groupBy: vi.fn().mockResolvedValue([]) },
      classFeedback: {
        findMany: vi.fn().mockResolvedValue(
          Array.from({ length: respuestas }, () => ({
            seguimiento: 'SI',
            problemas: [],
            comentario: 'no debe viajar',
            booking: { classroomId: 'aula-1', studentId: ESTUDIANTE_ID },
          })),
        ),
      },
    } as unknown as PrismaService;

    return new HistorialService(prisma).listHistorial(profesor, {});
  }

  it('con 2 respuestas la valoración es null', async () => {
    const resultado = await historialCon(2);

    expect((resultado.items[0] as { valoracion: unknown }).valoracion).toBeNull();
  });

  it('con 3 respuestas trae los conteos y ni id de estudiante ni comentario', async () => {
    const resultado = await historialCon(3);
    const item = resultado.items[0] as { valoracion: { respuestas: number; si: number } };

    expect(item.valoracion).toMatchObject({ respuestas: 3, si: 3 });
    const json = JSON.stringify(resultado);
    expect(json).not.toContain(ESTUDIANTE_ID);
    expect(json).not.toContain('no debe viajar');
  });
});
