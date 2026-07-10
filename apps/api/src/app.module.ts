import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CommonModule } from './common/common.module';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';

/** Módulo raíz: compone los módulos de dominio de la aplicación. */
@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ClassroomsModule,
    BookingsModule,
    SessionsModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
