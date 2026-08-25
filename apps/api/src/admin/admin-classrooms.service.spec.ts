import {
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
} from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../prisma/prisma.service';
import { AdminClassroomsService } from './admin-classrooms.service';
import type { ListAdminClassroomsDto } from './dto/list-admin-classrooms.dto';

function fila(overrides: Record<string, unknown> = {}) {
  return {
    id: 'aula-1',
    teacherId: 'profe-1',
    title: 'Conversación cotidiana',
    description: 'Práctica de charla informal.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 2,
    scheduledAt: new Date('2026-08-12T23:00:00.000Z'),
    durationMinutes: 60,
    meetingLink: 'v1.iv.tag.texto',
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    teacher: { firstName: 'Paula', lastName: 'Profesora' },
    ...overrides,
  };
}

function setup(filas: ReturnType<typeof fila>[] = [], total = filas.length) {
  const findMany = vi.fn().mockResolvedValue(filas);
  const count = vi.fn().mockResolvedValue(total);
  const prisma = { classroom: { findMany, count } } as unknown as PrismaService;

  return { service: new AdminClassroomsService(prisma), findMany, count };
}

beforeEach(() => vi.clearAllMocks());

describe('AdminClassroomsService.listAll — sin filtros (T3)', () => {
  it('no excluye nada por defecto: el `where` va vacío', async () => {
    const { service, findMany } = setup([fila()]);

    await service.listAll({} as ListAdminClassroomsDto);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [] } }));
  });

  it('trae aulas de varios profesores (AC1)', async () => {
    const { service } = setup([
      fila({ id: 'aula-1', teacherId: 'profe-1', teacher: { firstName: 'Paula', lastName: 'P' } }),
      fila({ id: 'aula-2', teacherId: 'profe-2', teacher: { firstName: 'Marco', lastName: 'M' } }),
    ]);

    const resultado = await service.listAll({} as ListAdminClassroomsDto);

    expect(new Set(resultado.items.map((item) => item.teacherId)).size).toBe(2);
  });

  it('incluye canceladas y pasadas (AC2)', async () => {
    const { service } = setup([
      fila({ id: 'cancelada', status: ClassroomStatus.CANCELLED }),
      fila({ id: 'pasada', scheduledAt: new Date('2020-01-01T00:00:00.000Z') }),
    ]);

    const resultado = await service.listAll({} as ListAdminClassroomsDto);

    expect(resultado.items.map((item) => item.id)).toEqual(['cancelada', 'pasada']);
  });
});

describe('AdminClassroomsService.listAll — filtros combinables (T4, AC5)', () => {
  it('filtra por profesor', async () => {
    const { service, findMany } = setup();

    await service.listAll({ teacherId: 'profe-1' } as ListAdminClassroomsDto);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { AND: [{ teacherId: 'profe-1' }] } }),
    );
  });

  it('filtra por estado', async () => {
    const { service, findMany } = setup();

    await service.listAll({ status: ClassroomStatus.CANCELLED } as ListAdminClassroomsDto);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { AND: [{ status: ClassroomStatus.CANCELLED }] } }),
    );
  });

  it('filtra por rango de fechas', async () => {
    const { service, findMany } = setup();

    await service.listAll({
      desde: '2026-01-01T00:00:00.000Z',
      hasta: '2026-12-31T00:00:00.000Z',
    } as ListAdminClassroomsDto);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { scheduledAt: { gte: new Date('2026-01-01T00:00:00.000Z') } },
            { scheduledAt: { lte: new Date('2026-12-31T00:00:00.000Z') } },
          ],
        },
      }),
    );
  });

  it('combina los tres filtros a la vez', async () => {
    const { service, findMany } = setup();

    await service.listAll({
      teacherId: 'profe-1',
      status: ClassroomStatus.PUBLISHED,
      desde: '2026-01-01T00:00:00.000Z',
    } as ListAdminClassroomsDto);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { teacherId: 'profe-1' },
            { status: ClassroomStatus.PUBLISHED },
            { scheduledAt: { gte: new Date('2026-01-01T00:00:00.000Z') } },
          ],
        },
      }),
    );
  });
});

describe('AdminClassroomsService.listAll — orden y paginación (AC6, T6)', () => {
  it('ordena por scheduledAt descendente', async () => {
    const { service, findMany } = setup();

    await service.listAll({} as ListAdminClassroomsDto);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { scheduledAt: 'desc' } }),
    );
  });

  it('devuelve el mismo formato de paginación que el catálogo', async () => {
    const { service } = setup([fila()], 1);

    const resultado = await service.listAll({ page: 2, pageSize: 10 } as ListAdminClassroomsDto);

    expect(resultado).toMatchObject({ total: 1, page: 2, pageSize: 10 });
  });
});

describe('AdminClassroomsService.listAll — el enlace nunca viaja (T5, AC4)', () => {
  it('ningún item de la respuesta trae meetingLink, ni siquiera para el admin', async () => {
    const { service } = setup([fila()]);

    const resultado = await service.listAll({} as ListAdminClassroomsDto);

    for (const item of resultado.items) {
      expect(item).not.toHaveProperty('meetingLink');
    }
    expect(JSON.stringify(resultado)).not.toContain('v1.iv.tag.texto');
  });
});
