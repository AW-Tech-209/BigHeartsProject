import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CommonModule } from './common/common.module';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app-config.service';
import { HealthModule } from './health/health.module';
import { HistorialModule } from './historial/historial.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RemindersModule } from './reminders/reminders.module';
import { UsersModule } from './users/users.module';

/** Módulo raíz: compone los módulos de dominio de la aplicación. */
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CommonModule,
    // Rate limiting: la ventana y el límite salen de la config. El módulo es
    // global; el AuthThrottlerGuard lo aplica solo a login y register.
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [{ ttl: config.authThrottleTtl * 1000, limit: config.authThrottleLimit }],
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    ClassroomsModule,
    BookingsModule,
    NotificationsModule,
    RemindersModule,
    AdminModule,
    HistorialModule,
  ],
})
export class AppModule {}
