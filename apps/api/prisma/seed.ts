/**
 * Seed de la base de datos.
 *
 *  - SIEMPRE crea el usuario Admin del sistema, con credenciales tomadas de
 *    variables de entorno (ADMIN_EMAIL / ADMIN_PASSWORD). Así el MISMO seed
 *    sirve en desarrollo y en producción sin hornear credenciales en el repo.
 *  - En entornos NO productivos, además crea usuarios de prueba (profesor y
 *    estudiante) con una contraseña conocida, para agilizar el desarrollo.
 *
 * Idempotente: `upsert` por email, así que se puede re-ejecutar sin duplicar.
 * La contraseña se hashea con bcrypt (mismo coste que el registro real).
 *
 * Ejecución: npm run db:seed --workspace @academia/api
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { BCRYPT_SALT_ROUNDS } from '../src/auth/auth.constants';

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
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`  ✔ ADMIN   ${email}`);
}

/** Usuarios de prueba, solo para desarrollo. */
async function seedTestUsers(): Promise<void> {
  const password = process.env.SEED_TEST_PASSWORD?.trim() || 'Password123!';
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const users = [
    {
      email: 'profe@academia.local',
      firstName: 'Paula',
      lastName: 'Profesora',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'alumno@academia.local',
      firstName: 'Aitor',
      lastName: 'Alumno',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password: passwordHash },
    });
    console.log(`  ✔ ${user.role.padEnd(7)} ${user.email}  (contraseña: ${password})`);
  }
}

async function main(): Promise<void> {
  await seedAdmin();

  // En producción NO se siembran usuarios de prueba.
  if (process.env.NODE_ENV !== 'production') {
    await seedTestUsers();
  }

  const total = await prisma.user.count();
  console.log(`Seed completado. Usuarios en la BD: ${total}.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed fallido:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
