import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Gestión de usuarios: alumnos, profesores y administradores.
 *
 * Hoy solo cubre el perfil propio (HU-103). PrismaService se inyecta desde su
 * módulo global. La gestión de usuarios por parte de un administrador vive en
 * `AdminModule`, no aquí.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
