import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoggingNotificationService } from './logging-notification.service';
import { NotificationType } from './notification.service';

/**
 * El adaptador de Fase 1 no envía nada, así que lo único que puede fallar es
 * que registre mal — y el registro ES su producto: es lo que responde "¿se le
 * avisó a este profesor?" cuando alguien pregunte.
 */
describe('LoggingNotificationService', () => {
  let service: LoggingNotificationService;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new LoggingNotificationService();
    log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  it('registra destinatario, tipo de evento y resultado', async () => {
    await service.notify({
      type: NotificationType.TEACHER_APPROVED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: NotificationType.TEACHER_APPROVED,
        destinatario: 'paula@academia.local',
        entregado: false,
        canal: 'log',
      }),
    );
  });

  it('devuelve `delivered: false`: en Fase 1 no hay envío real que prometer', async () => {
    const result = await service.notify({
      type: NotificationType.TEACHER_REJECTED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });

    expect(result).toEqual({ delivered: false, channel: 'log' });
  });

  it('no registra nada más que email, nombre de evento y resultado', async () => {
    await service.notify({
      type: NotificationType.TEACHER_APPROVED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });

    // Un adaptador que se llevara el objeto entero al log acabaría filtrando
    // el `password` el día que alguien le pase la entidad de Prisma completa.
    const registrado = log.mock.calls[0]![0] as Record<string, unknown>;
    expect(Object.keys(registrado).sort()).toEqual([
      'canal',
      'destinatario',
      'entregado',
      'mensaje',
      'tipo',
    ]);
  });
});
