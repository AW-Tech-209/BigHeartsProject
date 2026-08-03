import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Acceso a la base de datos vía Prisma.
 *
 * `@Global()` para que cualquier módulo de dominio (users, bookings...) pueda
 * inyectar `PrismaService` sin re-importar este módulo. La base de datos es
 * infraestructura transversal, igual que la configuración.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
