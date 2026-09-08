import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { AuthThrottlerGuard } from './auth/guards/auth-throttler.guard';
import { BookingsModule } from './bookings/bookings.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CommonModule } from './common/common.module';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app-config.service';
import { HealthModule } from './health/health.module';
import { HistorialModule } from './historial/historial.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PanelModule } from './panel/panel.module';
import { PrismaModule } from './prisma/prisma.module';
import { RemindersModule } from './reminders/reminders.module';
import { UsersModule } from './users/users.module';

/** Módulo raíz: compone los módulos de dominio de la aplicación. */
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CommonModule,
    // Límite base: el de /auth. `@Throttle(API_THROTTLE)` lo afloja en el
    // resto de controladores (`common/api-throttle.ts`).
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
    PanelModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthThrottlerGuard }],
})
export class AppModule {}
