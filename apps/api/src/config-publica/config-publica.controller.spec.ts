import 'reflect-metadata';
import { describe, expect, it } from 'vitest';

import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import type { AppConfigService } from '../config/app-config.service';
import { ConfigPublicaController } from './config-publica.controller';

describe('ConfigPublicaController', () => {
  it('es @Public()', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ConfigPublicaController.prototype.obtener)).toBe(
      true,
    );
  });

  it.each([true, false])('refleja el entorno: registroAbierto=%s', (abierto) => {
    const controller = new ConfigPublicaController({
      publicRegistrationEnabled: abierto,
    } as AppConfigService);

    expect(controller.obtener()).toEqual({ registroAbierto: abierto });
  });
});
