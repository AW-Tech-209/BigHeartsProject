import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import { crearAdaptadorDeNotificaciones } from './notifications.module';
import { LoggingNotificationService } from './logging-notification.service';
import { ResendNotificationService } from './resend-notification.service';

describe('crearAdaptadorDeNotificaciones', () => {
  beforeEach(() => {
    vi.spyOn(Logger, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
  });

  it('sin RESEND_API_KEY, cae al adaptador de log y avisa al arrancar', () => {
    const config = { resendApiKey: undefined } as AppConfigService;

    const adaptador = crearAdaptadorDeNotificaciones(config);

    expect(adaptador).toBeInstanceOf(LoggingNotificationService);
    expect(Logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('RESEND_API_KEY'),
      'NotificationsModule',
    );
  });

  it('con RESEND_API_KEY, usa el adaptador de Resend', () => {
    const config = {
      resendApiKey: 'clave-de-prueba',
      emailFrom: 'avisos@academia.local',
    } as AppConfigService;

    const adaptador = crearAdaptadorDeNotificaciones(config);

    expect(adaptador).toBeInstanceOf(ResendNotificationService);
  });
});
