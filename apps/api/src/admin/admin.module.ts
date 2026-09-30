import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminClassroomsController } from './admin-classrooms.controller';
import { AdminClassroomsService } from './admin-classrooms.service';
import { AdminMetricasController } from './admin-metricas.controller';
import { AdminMetricasService } from './admin-metricas.service';
import { AdminUsuariosController } from './admin-usuarios.controller';
import { AdminUsuariosService } from './admin-usuarios.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Operaciones de back-office reservadas al rol ADMIN.
 *
 * Aprobación de profesores (HU-104) y supervisión de aulas (HU-210).
 * PrismaService llega desde su módulo global; `NotificationsModule` se
 * importa por el puerto `NotificationService`, no por su implementación.
 *
 * La autorización no vive aquí sino en `@Roles(UserRole.ADMIN)` sobre cada
 * controlador, que el `RolesGuard` global aplica.
 */
@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [
    AdminController,
    AdminClassroomsController,
    AdminMetricasController,
    AdminUsuariosController,
  ],
  providers: [AdminService, AdminClassroomsService, AdminMetricasService, AdminUsuariosService],
})
export class AdminModule {}
