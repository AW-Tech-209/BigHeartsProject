import { Injectable, Logger } from '@nestjs/common';

import {
  type Notification,
  type NotificationResult,
  NotificationService,
} from './notification.service';

/**
 * Adaptador de Fase 1: **registra** el aviso en vez de enviarlo.
 *
 * No es un `TODO` ni un stub que haya que recordar sustituir: es el adaptador
 * que corresponde a un repo sin proveedor de correo (el proveedor sigue sin
 * decidirse, `docs/ARQUITECTURA.md` §14.6 nº5). Deja el AC6 de la HU-104
 * verificable hoy con un espía, y deja el cableado hecho para el Sprint 4.
 *
 * El registro es ESTRUCTURADO —un objeto, no una frase— porque su lector no es
 * una persona leyendo la consola sino quien mañana tenga que responder "¿se le
 * avisó a este profesor?" buscando por email en los logs de Render.
 *
 * Lo que NO va al log: nada sensible. Aquí solo hay email, nombre y tipo de
 * evento. Ni contraseñas, ni tokens, ni enlaces de clase.
 */
@Injectable()
export class LoggingNotificationService extends NotificationService {
  private readonly logger = new Logger(LoggingNotificationService.name);

  async notify(notification: Notification): Promise<NotificationResult> {
    const result: NotificationResult = { delivered: false, channel: 'log' };

    this.logger.log({
      mensaje: 'Notificación registrada (sin envío real)',
      tipo: notification.type,
      destinatario: notification.recipient.email,
      entregado: result.delivered,
      canal: result.channel,
    });

    // `async` sin `await`: la firma del puerto es asíncrona porque el adaptador
    // real hará E/S. Devolver una promesa ya resuelta mantiene ese contrato sin
    // fingir un trabajo que aquí no existe.
    return result;
  }
}
