import { randomUUID } from 'node:crypto';

import { EnglishLevel, UserRole, UserStatus } from '@academia/types';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { AuthenticatedUser } from '../src/auth/auth.types';
import { BookingsService } from '../src/bookings/bookings.service';
import type { AppConfigService } from '../src/config/app-config.service';
import type { NotificationService } from '../src/notifications/notification.service';
import type { PrismaService } from '../src/prisma/prisma.service';

/**
 * Verifica contra una base de datos real (HU-308), no contra mocks: son las
 * únicas garantías de esta HU que un mock no puede probar. Necesita
 * `docker compose up postgres` (o el servicio de CI) con las migraciones
 * aplicadas.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta ${name}: estos tests requieren una BD real con las migraciones aplicadas.`,
    );
  }
  return value;
}

// DIRECT_URL, no DATABASE_URL: con el pooler de Supabase, information_schema
// (y pg_indexes) no es de fiar (trampa conocida #5).
const prisma = new PrismaClient({ datasources: { db: { url: requireEnv('DIRECT_URL') } } });

const CONFIG = {
  cancellationWindowMinutes: 60,
  accessWindowMinutes: 30,
} as unknown as AppConfigService;

const notifications = {
  notify: async () => ({ delivered: false, channel: 'log' as const }),
} as unknown as NotificationService;

describe('índice de bookings contra la base de datos real (HU-308)', () => {
  const teacherId = randomUUID();
  const studentId = randomUUID();
  let classroomId: string;

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
    await prisma.user.create({
      data: {
        id: studentId,
        email: `alumno-${studentId}@academia.local`,
        password: 'irrelevante',
        firstName: 'Sofía',
        lastName: 'Estudiante',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { studentId } });
    await prisma.classroom.deleteMany({ where: { teacherId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId, studentId] } } });
    await prisma.$disconnect();
  });

  it('AC2 — el índice único es parcial (WHERE status = CONFIRMED) y no existe uno total', async () => {
    const indices = await prisma.$queryRaw<{ indexname: string; indexdef: string }[]>`
      SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'bookings'
    `;

    const parcial = indices.find((i) => i.indexname === 'bookings_active_uniq');
    expect(parcial).toBeDefined();
    expect(parcial!.indexdef).toContain('WHERE');
    expect(parcial!.indexdef).toContain('CONFIRMED');

    const totalSobreMismasColumnas = indices.filter(
      (i) =>
        i.indexdef.includes('UNIQUE') &&
        i.indexdef.includes('student_id') &&
        i.indexdef.includes('classroom_id') &&
        !i.indexdef.includes('WHERE'),
    );
    expect(totalSobreMismasColumnas).toHaveLength(0);
  });

  it('AC3 y AC4 — reservar, cancelar y volver a reservar funciona; dos CONFIRMED simultáneas no', async () => {
    classroomId = randomUUID();
    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.classroom.create({
      data: {
        id: classroomId,
        teacherId,
        title: 'Aula de prueba HU-308',
        description: 'Aula creada solo para este test.',
        level: EnglishLevel.BEGINNER,
        maxStudents: 5,
        scheduledAt,
        durationMinutes: 60,
        meetingLink: 'v1.irrelevante.irrelevante.irrelevante',
      },
    });

    const student: AuthenticatedUser = {
      id: studentId,
      email: `alumno-${studentId}@academia.local`,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    };
    const service = new BookingsService(prisma as unknown as PrismaService, notifications, CONFIG);

    const primera = await service.createBooking(student, { classroomId });
    await service.cancelBooking(student, primera.booking.id);
    const segunda = await service.createBooking(student, { classroomId });
    expect(segunda.booking.id).not.toBe(primera.booking.id);

    // Con la app fuera de escena: el índice parcial sigue siendo la red de
    // seguridad de §4.2 aunque `@@unique` haya desaparecido del schema.
    await expect(
      prisma.$executeRaw`INSERT INTO bookings (id, student_id, classroom_id, status, created_at, updated_at)
        VALUES (${randomUUID()}::uuid, ${studentId}::uuid, ${classroomId}::uuid, 'CONFIRMED', now(), now())`,
    ).rejects.toThrow();
  });
});
