import { Logger, Module } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';
import { LoggingNotificationService } from './logging-notification.service';
import { NotificationService } from './notification.service';
import { ResendNotificationService } from './resend-notification.service';

/**
 * Decide el adaptador activo según `RESEND_API_KEY` (D32) y lo dice en el log
 * de arranque: no se descubre por un correo que no llega (AC4).
 */
export function crearAdaptadorDeNotificaciones(config: AppConfigService): NotificationService {
  if (config.resendApiKey) {
    Logger.log('Adaptador de notificaciones: Resend', 'NotificationsModule');
    return new ResendNotificationService(config);
  }

  Logger.warn(
    'RESEND_API_KEY no configurada: los avisos solo se registran en el log, no se envían.',
    'NotificationsModule',
  );
  return new LoggingNotificationService();
}

/** Notificaciones a usuarios: un PUERTO con dos adaptadores (D14, D32). */
@Module({
  providers: [
    {
      provide: NotificationService,
      useFactory: crearAdaptadorDeNotificaciones,
      inject: [AppConfigService],
    },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
