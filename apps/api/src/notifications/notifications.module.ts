import { Module } from '@nestjs/common';

import { LoggingNotificationService } from './logging-notification.service';
import { NotificationService } from './notification.service';

/**
 * Notificaciones a usuarios: un PUERTO con un adaptador enchufado.
 *
 * `NotificationService` (abstracto) es a la vez el contrato y el token de
 * inyección; `LoggingNotificationService` es la implementación activa en Fase 1.
 * Quien inyecta el puerto no sabe —ni debe saber— cuál de los dos recibe.
 *
 * **Para el Sprint 4:** enchufar el proveedor real es cambiar el `useClass` de
 * abajo por el adaptador nuevo. Nada más. Ningún llamador se toca, ningún test
 * de dominio se reescribe: eso es exactamente lo que compra este módulo
 * (decisión D14, `docs/ARQUITECTURA.md` §4.6). El proveedor concreto sigue sin
 * decidirse (§14.6 nº5); esa decisión no bloquea a nadie mientras el puerto
 * exista.
 */
@Module({
  providers: [{ provide: NotificationService, useClass: LoggingNotificationService }],
  exports: [NotificationService],
})
export class NotificationsModule {}
