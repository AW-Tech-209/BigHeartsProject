import {
  BookingStatus,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  UserRole,
  UserStatus,
} from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import type { PrismaService } from '../prisma/prisma.service';
import type { ListHistorialDto } from './dto/list-historial.dto';
import { HistorialService } from './historial.service';

const ESTUDIANTE_ID = '11111111-1111-4111-8111-111111111111';
const OTRO_ESTUDIANTE_ID = '99999999-9999-4999-8999-999999999999';
const PROFESOR_ID = '22222222-2222-4222-8222-222222222222';

const estudianteDelToken: AuthenticatedUser = {
  id: ESTUDIANTE_ID,
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

const profesorDelToken: AuthenticatedUser = {
  id: PROFESOR_ID,
  email: 'paula@academia.local',
  role: UserRole.TEACHER,
  status: UserStatus.ACTIVE,
};

const AYER = new Date('2020-08-11T23:00:00.000Z');
const ANTEAYER = new Date('2020-08-10T23:00:00.000Z');
const AHORA = new Date('2020-08-12T00:00:00.000Z');

function filaDeAula(overrides: Record<string, unknown> = {}) {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    teacherId: PROFESOR_ID,
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 2,
    scheduledAt: ANTEAYER,
    durationMinutes: 60,
    meetingLink: 'v1.iv.tag.texto',
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: new Date('2020-08-01T10:00:00.000Z'),
    updatedAt: new Date('2020-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

function filaDeReserva(
  id: string,
  status: BookingStatus,
  classroomOverrides: Record<string, unknown> = {},
) {
  return {
    id,
    status,
    classroom: {
      ...filaDeAula(classroomOverrides),
      teacher: { firstName: 'Paula', lastName: 'Profesora' },
    },
  };
}

vi.useFakeTimers();
vi.setSystemTime(AHORA);

describe('HistorialService.listHistorial — estudiante (AC1)', () => {
  it('acota siempre al estudiante del token, sin importar lo que traiga el query', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const prisma = { booking: { findMany, count } } as unknown as PrismaService;
    const service = new HistorialService(prisma);
    const conIntruso = { studentId: OTRO_ESTUDIANTE_ID } as unknown as ListHistorialDto;

    await service.listHistorial(estudianteDelToken, conIntruso);

    expect(findMany.mock.calls[0]?.[0].where.studentId).toBe(ESTUDIANTE_ID);
    expect(count.mock.calls[0]?.[0].where.studentId).toBe(ESTUDIANTE_ID);
  });

  it('devuelve el resultado de cada reserva como myBookingStatus, y el meetingLink no viaja', async () => {
    const filas = [filaDeReserva('r1', BookingStatus.ATTENDED)];
    const prisma = {
      booking: { findMany: vi.fn().mockResolvedValue(filas), count: vi.fn().mockResolvedValue(1) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    const resultado = await service.listHistorial(estudianteDelToken, {});

    expect(resultado.items).toHaveLength(1);
    const item = resultado.items[0] as { myBookingStatus: BookingStatus; meetingLink?: string };
    expect(item.myBookingStatus).toBe(BookingStatus.ATTENDED);
    expect(item.meetingLink).toBeUndefined();
    expect(Object.keys(item)).not.toContain('meetingLink');
  });

  it('filtra por resultado cuando se pide', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      booking: { findMany, count: vi.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    await service.listHistorial(estudianteDelToken, { resultado: BookingStatus.NO_SHOW });

    expect(findMany.mock.calls[0]?.[0].where.status).toBe(BookingStatus.NO_SHOW);
  });

  it('ordena el historial descendente, lo más reciente primero', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      booking: { findMany, count: vi.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    await service.listHistorial(estudianteDelToken, {});

    expect(findMany.mock.calls[0]?.[0].orderBy).toEqual({ classroom: { scheduledAt: 'desc' } });
  });

  it('combina el rango de fechas con el resto del filtro', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      booking: { findMany, count: vi.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    await service.listHistorial(estudianteDelToken, {
      desde: ANTEAYER.toISOString(),
      hasta: AYER.toISOString(),
    });

    const where = findMany.mock.calls[0]?.[0].where;
    expect(where.classroom.scheduledAt).toEqual({ gte: ANTEAYER, lte: AYER });
  });
});

describe('HistorialService.listHistorial — profesor (AC2)', () => {
  it('acota siempre al profesor del token', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const prisma = {
      classroom: { findMany, count },
      booking: { groupBy: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);
    const conIntruso = { teacherId: PROFESOR_ID } as unknown as ListHistorialDto;

    await service.listHistorial(profesorDelToken, conIntruso);

    expect(findMany.mock.calls[0]?.[0].where.teacherId).toBe(PROFESOR_ID);
    expect(count.mock.calls[0]?.[0].where.teacherId).toBe(PROFESOR_ID);
  });

  it('cuenta inscritos (CONFIRMED+ATTENDED+NO_SHOW) y asistentes (solo ATTENDED), sin las CANCELLED', async () => {
    const aula = filaDeAula({ id: 'aula-1' });
    const prisma = {
      classroom: {
        findMany: vi.fn().mockResolvedValue([aula]),
        count: vi.fn().mockResolvedValue(1),
      },
      booking: {
        groupBy: vi.fn().mockResolvedValue([
          { classroomId: 'aula-1', status: BookingStatus.ATTENDED, _count: { _all: 3 } },
          { classroomId: 'aula-1', status: BookingStatus.NO_SHOW, _count: { _all: 1 } },
          { classroomId: 'aula-1', status: BookingStatus.CANCELLED, _count: { _all: 2 } },
        ]),
      },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    const resultado = await service.listHistorial(profesorDelToken, {});

    const item = resultado.items[0] as { totalInscritos: number; totalAsistieron: number };
    expect(item.totalInscritos).toBe(4);
    expect(item.totalAsistieron).toBe(3);
  });

  it('el meetingLink no viaja en el historial del profesor', async () => {
    const aula = filaDeAula({ id: 'aula-1' });
    const prisma = {
      classroom: {
        findMany: vi.fn().mockResolvedValue([aula]),
        count: vi.fn().mockResolvedValue(1),
      },
      booking: { groupBy: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    const resultado = await service.listHistorial(profesorDelToken, {});

    expect(Object.keys(resultado.items[0] as object)).not.toContain('meetingLink');
  });

  it('deja fuera una aula CANCELLED, aunque ya haya pasado', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      classroom: { findMany, count: vi.fn().mockResolvedValue(0) },
      booking: { groupBy: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const service = new HistorialService(prisma);

    await service.listHistorial(profesorDelToken, {});

    expect(findMany.mock.calls[0]?.[0].where.status).toEqual({ not: ClassroomStatus.CANCELLED });
  });
});
