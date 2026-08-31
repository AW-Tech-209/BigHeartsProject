import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import { NotificationType } from './notification.service';
import { ResendNotificationService } from './resend-notification.service';

const send = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return { emails: { send } };
  }),
}));

function configFalso(): AppConfigService {
  return {
    resendApiKey: 'clave-de-prueba',
    emailFrom: 'avisos@academia.local',
  } as AppConfigService;
}

describe('ResendNotificationService', () => {
  let service: ResendNotificationService;

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    service = new ResendNotificationService(configFalso());
  });

  it('no lanza aunque el proveedor rechace el envío', async () => {
    send.mockRejectedValue(new Error('Resend no responde'));
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(
      service.notify({
        type: NotificationType.BOOKING_CONFIRMED,
        recipient: { email: 'ana@academia.local', firstName: 'Ana' },
        classroom: { title: 'Inglés A1', scheduledAt: new Date(), durationMinutes: 60 },
      }),
    ).resolves.toEqual({ delivered: true, channel: 'email' });
  });

  it('llama al proveedor una sola vez por evento', async () => {
    await service.notify({
      type: NotificationType.TEACHER_APPROVED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'avisos@academia.local', to: 'paula@academia.local' }),
    );
  });

  it('no espera la respuesta del proveedor: resuelve antes de que `send` termine', async () => {
    let resuelto = false;
    send.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resuelto = true;
            resolve({ data: { id: 'email-1' }, error: null });
          }, 20);
        }),
    );

    await service.notify({
      type: NotificationType.TEACHER_REJECTED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });

    expect(resuelto).toBe(false);
  });

  it('rellena la plantilla con los datos de la clase y la hora con su zona', async () => {
    await service.notify({
      type: NotificationType.BOOKING_CONFIRMED,
      recipient: { email: 'ana@academia.local', firstName: 'Ana' },
      classroom: {
        title: 'Inglés A1',
        scheduledAt: new Date('2026-08-12T18:00:00.000Z'),
        durationMinutes: 60,
      },
    });

    const payload = send.mock.calls[0]![0];
    expect(payload.html).toContain('Inglés A1');
    expect(payload.text).toContain('Inglés A1');
    expect(payload.text).toContain('UTC');
  });
});
