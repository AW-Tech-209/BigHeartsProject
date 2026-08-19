import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Operaciones de back-office reservadas al rol ADMIN.
 *
 * Hoy solo la aprobación de profesores (HU-104). PrismaService llega desde su
 * módulo global; `NotificationsModule` se importa por el puerto
 * `NotificationService`, no por su implementación.
 *
 * La autorización no vive aquí sino en `@Roles(UserRole.ADMIN)` sobre el
 * controlador, que el `RolesGuard` global aplica.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
