import {
  BookingStatus,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  UserRole,
  UserStatus,
} from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../prisma/prisma.service';
import { PanelService } from './panel.service';

const ESTUDIANTE_ID = '11111111-1111-4111-8111-111111111111';
const OTRO_ID = '99999999-9999-4999-8999-999999999999';
const PROFESOR_ID = '22222222-2222-4222-8222-222222222222';
const AHORA = new Date('2026-09-03T12:00:00.000Z');

const estudiante: AuthenticatedUser = {
  id: ESTUDIANTE_ID,
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};
const profesor: AuthenticatedUser = { ...estudiante, id: PROFESOR_ID, role: UserRole.TEACHER };
const admin: AuthenticatedUser = { ...estudiante, id: 'a', role: UserRole.ADMIN };

const config = {
  accessWindowMinutes: 30,
  cancellationWindowMinutes: 60,
} as unknown as AppConfigService;

function filaDeAula(overrides: Record<string, unknown> = {}) {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    teacherId: PROFESOR_ID,
    title: 'Conversación cotidiana',
    description: 'Saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 2,
    scheduledAt: new Date('2026-09-05T15:00:00.000Z'),
    durationMinutes: 60,
    meetingLink: 'v1.iv.tag.cifrado',
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: AHORA,
    updatedAt: AHORA,
    teacher: { firstName: 'Paula', lastName: 'Profesora' },
    ...overrides,
  };
}

function prismaMock(overrides: Record<string, unknown>) {
  return {
    user: { findUnique: vi.fn(), count: vi.fn() },
    booking: { findFirst: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    classroom: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    ...overrides,
  } as unknown as PrismaService;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AHORA);
});

describe('PanelService.resumen — reparto por rol (AC1, AC3)', () => {
  it('al estudiante le devuelve la forma del estudiante y acota al id del token', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const count = vi.fn().mockResolvedValue(3);
    const prisma = prismaMock({
      user: {
        findUnique: vi.fn().mockResolvedValue({ communicationPreference: null }),
        count: vi.fn(),
      },
      booking: { findFirst, count, findMany: vi.fn() },
    });

    const resumen = await new PanelService(prisma, config).resumen({
      ...estudiante,
      // un intruso en un campo que el endpoint no declara: se ignora
      ...({ studentId: OTRO_ID } as object),
    } as AuthenticatedUser);

    expect(resumen).toMatchObject({
      rol: UserRole.STUDENT,
      reservasActivas: 3,
      sinPreferencia: true,
    });
    expect(findFirst.mock.calls[0]?.[0].where.studentId).toBe(ESTUDIANTE_ID);
    expect(count.mock.calls[0]?.[0].where.studentId).toBe(ESTUDIANTE_ID);
  });

  it('cuenta las clases que coinciden solo si tienen cupo', async () => {
    const prisma = prismaMock({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          communicationPreference: CommunicationPreference.SIGN_LANGUAGE,
        }),
        count: vi.fn(),
      },
      booking: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn(),
      },
      classroom: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          { maxStudents: 8, currentBookings: 2 },
          { maxStudents: 5, currentBookings: 5 },
          { maxStudents: 4, currentBookings: 3 },
        ]),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
    });

    const resumen = await new PanelService(prisma, config).resumen(estudiante);

    expect(resumen).toMatchObject({ clasesQueCoinciden: 2, sinPreferencia: false });
  });

  it('la próxima clase del estudiante viaja sin meetingLink', async () => {
    const prisma = prismaMock({
      user: {
        findUnique: vi.fn().mockResolvedValue({ communicationPreference: null }),
        count: vi.fn(),
      },
      booking: {
        findFirst: vi.fn().mockResolvedValue({ id: 'r1', classroom: filaDeAula() }),
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn(),
      },
    });

    const resumen = await new PanelService(prisma, config).resumen(estudiante);
    const proxima = (resumen as unknown as { proximaClase: Record<string, unknown> }).proximaClase;

    expect(proxima.title).toBe('Conversación cotidiana');
    expect(Object.keys(proxima)).not.toContain('meetingLink');
    expect(proxima.myBookingStatus).toBe(BookingStatus.CONFIRMED);
  });

  it('al profesor le devuelve su forma: deuda de asistencia y recuento del grupo', async () => {
    const prisma = prismaMock({
      classroom: {
        findFirst: vi.fn().mockResolvedValue(filaDeAula()),
        findMany: vi.fn().mockResolvedValue([
          // terminada: empezó hace 3h, duró 60 min
          { scheduledAt: new Date('2026-09-03T09:00:00.000Z'), durationMinutes: 60 },
          // aún en curso: empezó hace 10 min, dura 60 min
          { scheduledAt: new Date('2026-09-03T11:50:00.000Z'), durationMinutes: 60 },
        ]),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      booking: {
        findFirst: vi.fn(),
        count: vi.fn(),
        findMany: vi
          .fn()
          .mockResolvedValue([
            { student: { communicationPreference: CommunicationPreference.SIGN_LANGUAGE } },
            { student: { communicationPreference: CommunicationPreference.SIGN_LANGUAGE } },
            { student: { communicationPreference: null } },
          ]),
      },
    });

    const resumen = await new PanelService(prisma, config).resumen(profesor);

    expect(resumen).toMatchObject({
      rol: UserRole.TEACHER,
      asistenciaSinMarcar: 1,
      comunicacionDelGrupo: {
        porModo: { [CommunicationPreference.SIGN_LANGUAGE]: 2 },
        sinIndicar: 1,
        total: 3,
      },
    });
    expect(
      Object.keys((resumen as unknown as { proximaClase: object }).proximaClase),
    ).not.toContain('meetingLink');
  });

  it('al admin le devuelve enteros: pendientes, hoy, en curso y ocupación literal', async () => {
    const prisma = prismaMock({
      user: { findUnique: vi.fn(), count: vi.fn().mockResolvedValue(4) },
      classroom: {
        findFirst: vi.fn(),
        count: vi.fn().mockResolvedValue(6),
        findMany: vi.fn().mockResolvedValue([
          { scheduledAt: new Date('2026-09-03T11:50:00.000Z'), durationMinutes: 60 },
          { scheduledAt: new Date('2026-09-03T09:00:00.000Z'), durationMinutes: 60 },
        ]),
        aggregate: vi.fn().mockResolvedValue({ _sum: { currentBookings: 84, maxStudents: 120 } }),
      },
    });

    const resumen = await new PanelService(prisma, config).resumen(admin);

    expect(resumen).toEqual({
      rol: UserRole.ADMIN,
      profesoresPendientes: 4,
      clasesHoy: 6,
      clasesEnCurso: 1,
      cuposReservadosSemana: 84,
      cuposOfrecidosSemana: 120,
    });
  });

  it('la ocupación del admin es 0 cuando no hay clases esa semana', async () => {
    const prisma = prismaMock({
      user: { findUnique: vi.fn(), count: vi.fn().mockResolvedValue(0) },
      classroom: {
        findFirst: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        aggregate: vi
          .fn()
          .mockResolvedValue({ _sum: { currentBookings: null, maxStudents: null } }),
      },
    });

    const resumen = await new PanelService(prisma, config).resumen(admin);

    expect(resumen).toMatchObject({ cuposReservadosSemana: 0, cuposOfrecidosSemana: 0 });
  });
});
