/**
 * Seed de la base de datos.
 *
 *  - SIEMPRE crea el usuario Admin del sistema, con credenciales tomadas de
 *    variables de entorno (ADMIN_EMAIL / ADMIN_PASSWORD). Así el MISMO seed
 *    sirve en desarrollo y en producción sin hornear credenciales en el repo.
 *  - En entornos NO productivos, además crea usuarios de prueba, aulas de
 *    demostración y reservas sobre ellas (HU-307), para poder enseñar el
 *    sistema completo sin fabricar el escenario a mano.
 *
 * Idempotente: `upsert` por email (usuarios) o por un id fijo (aulas,
 * reservas). Las fechas son SIEMPRE relativas a `now()`: un seed con fechas
 * absolutas caduca. `currentBookings` de cada aula se recalcula siempre a
 * partir de las reservas `CONFIRMED` realmente sembradas, así que reejecutar
 * el seed nunca lo descuadra.
 *
 * Ejecución: npm run db:seed --workspace @academia/api
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { BCRYPT_SALT_ROUNDS } from '../src/auth/auth.constants';
import type { AppConfigService } from '../src/config/app-config.service';
import { MeetingLinkCipher } from '../src/classrooms/meeting-link.cipher';
import {
  AULAS_DE_DEMOSTRACION,
  contarConfirmadasPorAula,
  RESERVAS_DE_DEMOSTRACION,
  USUARIOS_DE_PRUEBA,
} from './seed-data';

const prisma = new PrismaClient();

/** Lee una variable obligatoria del entorno o aborta con un mensaje claro. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${name}. Es obligatoria para sembrar el Admin ` +
        `(ver apps/api/.env.example).`,
    );
  }
  return value;
}

/** Crea (o respeta si ya existe) el Admin del sistema desde el entorno. */
async function seedAdmin(): Promise<void> {
  const email = requireEnv('ADMIN_EMAIL').toLowerCase().trim();
  const password = requireEnv('ADMIN_PASSWORD');
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Sistema';

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {}, // nunca pisamos un admin existente.
    create: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`  ✔ ADMIN   ${email}`);
}

async function seedTestUsers(): Promise<void> {
  const password = process.env.SEED_TEST_PASSWORD?.trim() || 'Password123!';
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  for (const user of USUARIOS_DE_PRUEBA) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password: passwordHash },
    });
    console.log(`  ✔ ${user.role.padEnd(7)} ${user.email}  (contraseña: ${password})`);
  }
}

/** Minutos desde ahora, positivos o negativos, como fecha absoluta. */
function minutosDesdeAhora(minutos: number): Date {
  return new Date(Date.now() + minutos * 60_000);
}

/** Aulas de ejemplo, a nombre de los profesores `ACTIVE` sembrados arriba. */
async function seedClassrooms(): Promise<void> {
  const meetingLinks = new MeetingLinkCipher({
    meetingLinkKey: requireEnv('MEETING_LINK_KEY'),
  } as AppConfigService);

  const teachers = await prisma.user.findMany({
    where: { email: { in: ['profe@academia.local', 'profe2@academia.local'] } },
    select: { id: true, email: true },
  });
  const teacherIdByEmail = new Map(teachers.map((t) => [t.email, t.id]));

  for (const aula of AULAS_DE_DEMOSTRACION) {
    const teacherId = teacherIdByEmail.get(aula.teacherEmail);
    if (!teacherId) {
      throw new Error(`Seed de aulas: no existe el profesor ${aula.teacherEmail}.`);
    }

    const data = {
      teacherId,
      title: aula.title,
      description: aula.description,
      level: aula.level,
      maxStudents: aula.maxStudents,
      scheduledAt: minutosDesdeAhora(aula.scheduledInMinutes),
      durationMinutes: aula.durationMinutes,
      meetingLink: meetingLinks.encrypt(aula.meetingLink),
      meetingProvider: aula.meetingProvider,
      status: aula.status ?? 'PUBLISHED',
      communicationModes: aula.communicationModes,
      hasInterpreter: aula.hasInterpreter ?? false,
      hasLiveCaptions: aula.hasLiveCaptions ?? false,
      hasVisualMaterials: aula.hasVisualMaterials ?? false,
    };

    await prisma.classroom.upsert({
      where: { id: aula.id },
      update: data,
      create: { id: aula.id, currentBookings: 0, ...data },
    });
    console.log(`  ✔ AULA    ${aula.title}`);
  }
}

/** Reservas de ejemplo (HU-307), a nombre de los estudiantes sembrados arriba. */
async function seedBookings(): Promise<void> {
  const students = await prisma.user.findMany({
    where: { email: { in: RESERVAS_DE_DEMOSTRACION.map((r) => r.studentEmail) } },
    select: { id: true, email: true },
  });
  const studentIdByEmail = new Map(students.map((s) => [s.email, s.id]));

  for (const reserva of RESERVAS_DE_DEMOSTRACION) {
    const studentId = studentIdByEmail.get(reserva.studentEmail);
    if (!studentId) {
      throw new Error(`Seed de reservas: no existe el estudiante ${reserva.studentEmail}.`);
    }

    const data = {
      studentId,
      classroomId: reserva.classroomId,
      status: reserva.status,
      cancelledAt:
        reserva.cancelledAtInMinutes !== undefined
          ? minutosDesdeAhora(reserva.cancelledAtInMinutes)
          : null,
    };

    await prisma.booking.upsert({
      where: { id: reserva.id },
      update: data,
      create: { id: reserva.id, ...data },
    });
  }
  console.log(`  ✔ RESERVAS ${RESERVAS_DE_DEMOSTRACION.length} sembradas`);
}

/**
 * `currentBookings` de cada aula sembrada se fija a partir de las reservas
 * `CONFIRMED` realmente escritas (T6): un solo cálculo, nunca dos números que
 * puedan discrepar entre sí ni entre ejecuciones del seed.
 */
async function cuadrarCuposConReservas(): Promise<void> {
  const confirmadasPorAula = contarConfirmadasPorAula(RESERVAS_DE_DEMOSTRACION);

  for (const aula of AULAS_DE_DEMOSTRACION) {
    await prisma.classroom.update({
      where: { id: aula.id },
      data: { currentBookings: confirmadasPorAula.get(aula.id) ?? 0 },
    });
  }
}

async function main(): Promise<void> {
  await seedAdmin();

  // En producción NO se siembran usuarios, aulas ni reservas de prueba.
  if (process.env.NODE_ENV !== 'production') {
    await seedTestUsers();
    await seedClassrooms();
    await seedBookings();
    await cuadrarCuposConReservas();
  }

  const [totalUsuarios, totalAulas, totalReservas] = await Promise.all([
    prisma.user.count(),
    prisma.classroom.count(),
    prisma.booking.count(),
  ]);
  console.log(
    `Seed completado. Usuarios: ${totalUsuarios}. Aulas: ${totalAulas}. Reservas: ${totalReservas}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed fallido:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
