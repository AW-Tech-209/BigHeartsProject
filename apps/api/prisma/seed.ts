/**
 * Seed INICIAL de la base de datos.
 *
 * Se ejecuta SIEMPRE —en cada deploy y en cada `docker compose up`— y hace una
 * sola cosa: garantizar que existe el usuario Admin del sistema, con
 * credenciales tomadas del entorno (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Así el
 * MISMO seed sirve en desarrollo y en producción sin hornear credenciales en el
 * repo.
 *
 * **No siembra datos de prueba.** Aulas, estudiantes y reservas de demostración
 * viven en `seed-demo.ts`, que se ejecuta a mano (`npm run db:seed:demo`).
 *
 * Idempotente: `upsert` por email con `update: {}`, así que nunca pisa un admin
 * existente y reejecutarlo no cambia nada.
 *
 * Ejecución: `npm run db:seed` (desde la raíz del repo).
 */
import { PrismaClient } from '@prisma/client';
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

async function main(): Promise<void> {
  const email = requireEnv('ADMIN_EMAIL').toLowerCase().trim();
  const password = requireEnv('ADMIN_PASSWORD');
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Sistema';

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
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
    select: { email: true },
  });

  console.log(`Seed inicial completado. Admin: ${admin.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed inicial fallido:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
