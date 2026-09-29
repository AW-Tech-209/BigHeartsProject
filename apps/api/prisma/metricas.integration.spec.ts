import { randomUUID } from 'node:crypto';

import { EnglishLevel, UserRole, UserStatus } from '@academia/types';
import { BookingStatus, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AdminMetricasService } from '../src/admin/admin-metricas.service';
import type { AppConfigService } from '../src/config/app-config.service';
import type { PrismaService } from '../src/prisma/prisma.service';

/** Contra una BD real (HU-516): el SQL agregado no se puede probar con mocks. */

const url = process.env.DIRECT_URL;
if (!url) throw new Error('Falta DIRECT_URL: estos tests requieren una BD real migrada.');

const prisma = new PrismaClient({ datasources: { db: { url } } });
const service = new AdminMetricasService(
  prisma as unknown as PrismaService,
  {
    academyTimezone: 'America/Bogota',
  } as AppConfigService,
);

const teacherId = randomUUID();
const studentIds: string[] = [];
const classroomIds: string[] = [];

async function crearAula(scheduledAt: string, maxStudents: number): Promise<string> {
  const inicio = new Date(scheduledAt);
  const aula = await prisma.classroom.create({
    data: {
      teacherId,
      title: 'Clase de prueba',
      description: 'Métricas',
      level: EnglishLevel.BEGINNER,
      maxStudents,
      scheduledAt: inicio,
      durationMinutes: 60,
      endsAt: new Date(inicio.getTime() + 3_600_000),
      meetingLink: 'v1.cifrado',
    },
  });
  classroomIds.push(aula.id);
  return aula.id;
}

async function crearEstudiantes(n: number): Promise<string[]> {
  const ids = Array.from({ length: n }, () => randomUUID());
  await prisma.user.createMany({
    data: ids.map((id) => ({
      id,
      email: `metricas-${id}@academia.local`,
      password: 'irrelevante',
      firstName: 'Est',
      lastName: 'Udiante',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    })),
  });
  studentIds.push(...ids);
  return ids;
}

const reservas = (classroomId: string, ids: string[], status: BookingStatus) =>
  ids.map((studentId) => ({ classroomId, studentId, status }));

beforeAll(async () => {
  await prisma.user.create({
    data: {
      id: teacherId,
      email: `profesor-${teacherId}@academia.local`,
      password: 'irrelevante',
      firstName: 'Ana',
      lastName: 'Profesora',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    },
  });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { classroomId: { in: classroomIds } } });
  await prisma.classroom.deleteMany({ where: { id: { in: classroomIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [teacherId, ...studentIds] } } });
  await prisma.$disconnect();
});

describe('métricas contra la base de datos real (HU-516)', () => {
  it('AC2/AC3: ocupación 0.6, asistencia 0.75 y lunes 19:00 COT en la franja lunes-19', async () => {
    const est = await crearEstudiantes(7);
    // Lunes 2020-03-02 19:00 COT = martes 2020-03-03 00:00 UTC.
    const lunes = await crearAula('2020-03-03T00:00:00Z', 10);
    const miercoles = await crearAula('2020-03-04T15:00:00Z', 10);

    await prisma.booking.createMany({
      data: [
        ...reservas(lunes, est.slice(0, 5), BookingStatus.ATTENDED),
        ...reservas(miercoles, est.slice(0, 4), BookingStatus.ATTENDED),
        ...reservas(miercoles, est.slice(4, 7), BookingStatus.NO_SHOW),
      ],
    });

    const m = await service.obtener({ desde: '2020-03-02', hasta: '2020-03-08' });

    expect(m.resumen.clasesImpartidas).toBe(2);
    expect(m.resumen.ocupacion).toBeCloseTo(0.6);
    expect(m.resumen.asistencia).toBeCloseTo(0.75);
    expect(m.resumen.estudiantesActivos).toBe(7);
    expect(m.porFranja.find((f) => f.diaSemana === 1 && f.hora === 19)?.clases).toBe(1);
    expect(m.porFranja.find((f) => f.diaSemana === 2)).toBeUndefined();
    expect(JSON.stringify(m)).not.toContain(est[0]);
  });

  it('AC5: 500 reservas se agregan en menos de 1 s', async () => {
    const est = await crearEstudiantes(500);
    const aula = await crearAula('2020-04-06T15:00:00Z', 500);
    await prisma.booking.createMany({ data: reservas(aula, est, BookingStatus.ATTENDED) });

    const inicio = performance.now();
    const m = await service.obtener({ desde: '2020-04-06', hasta: '2020-04-12' });

    expect(performance.now() - inicio).toBeLessThan(1000);
    expect(m.resumen.ocupacion).toBe(1);
  });
});
