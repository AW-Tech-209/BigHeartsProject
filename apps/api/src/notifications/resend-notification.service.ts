import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { AppConfigService } from '../config/app-config.service';
import { buildEmail } from './notification-templates';
import {
  type Notification,
  type NotificationResult,
  NotificationService,
} from './notification.service';

/**
 * Adaptador real (D32): envía por Resend. `notify()` no espera la respuesta
 * del proveedor (AC3) — dispara el envío y devuelve de inmediato; un fallo se
 * registra en el log, nunca se propaga (AC2).
 */
@Injectable()
export class ResendNotificationService extends NotificationService {
  private readonly logger = new Logger(ResendNotificationService.name);
  private readonly resend: Resend;

  constructor(private readonly config: AppConfigService) {
    super();
    this.resend = new Resend(config.resendApiKey);
  }

  async notify(notification: Notification): Promise<NotificationResult> {
    try {
      const email = buildEmail(notification);

      void this.resend.emails
        .send({
          from: this.config.emailFrom!,
          to: notification.recipient.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })
        .then((response) => {
          if (response.error) {
            this.logger.error(
              `No se pudo enviar ${notification.type} a ${notification.recipient.email}: ${response.error.message}`,
            );
          }
        })
        .catch((error: unknown) => {
          this.logger.error(
            `No se pudo enviar ${notification.type} a ${notification.recipient.email}`,
            error instanceof Error ? error.stack : String(error),
          );
        });

      return { delivered: true, channel: 'email' };
    } catch (error) {
      this.logger.error(
        `No se pudo preparar ${notification.type} para ${notification.recipient.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      return { delivered: false, channel: 'email' };
    }
  }
}
