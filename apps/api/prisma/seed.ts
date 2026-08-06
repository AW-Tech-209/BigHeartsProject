/**
 * Seed de datos de prueba para desarrollo.
 *
 * Crea un usuario por cada rol (admin, profesor, estudiante) con una contraseña
 * conocida. Es IDEMPOTENTE: usa `upsert` sobre el email (único), así que se
 * puede ejecutar tantas veces como haga falta sin duplicar ni fallar.
 *
 * Ejecución:
 *   npm run db:seed --workspace @academia/api
 * (docker-compose.yml lo lanza automáticamente al levantar el stack.)
 *
 * ⚠️ Solo para desarrollo. Nunca ejecutar contra staging/producción.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Contraseña compartida por todos los usuarios de prueba (solo en dev). */
const SEED_PASSWORD = 'Password123!';

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const SEED_USERS: SeedUser[] = [
  { email: 'admin@academia.local', firstName: 'Admin', lastName: 'Academia', role: UserRole.ADMIN },
  {
    email: 'profe@academia.local',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: UserRole.TEACHER,
  },
  {
    email: 'alumno@academia.local',
    firstName: 'Aitor',
    lastName: 'Alumno',
    role: UserRole.STUDENT,
  },
];

async function main(): Promise<void> {
  // bcrypt es lento a propósito; hasheamos una sola vez y reutilizamos.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // si ya existe, no lo tocamos (idempotente).
      create: { ...user, password: passwordHash },
    });
    console.log(`  ✔ ${user.role.padEnd(7)} ${user.email}`);
  }

  const total = await prisma.user.count();
  console.log(`Seed completado. Usuarios en la BD: ${total}. Contraseña: ${SEED_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed fallido:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
