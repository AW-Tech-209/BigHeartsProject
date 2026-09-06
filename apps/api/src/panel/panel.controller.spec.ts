import { UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { PanelController } from './panel.controller';
import type { PanelService } from './panel.service';

const estudiante: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

describe('PanelController.resumen — GET /panel/resumen (HU-502)', () => {
  it('pasa al servicio solo el usuario del token, sin ningún parámetro', async () => {
    const resumen = vi.fn().mockResolvedValue({ rol: UserRole.STUDENT });
    const controller = new PanelController({ resumen } as unknown as PanelService);

    await controller.resumen(estudiante);

    expect(resumen).toHaveBeenCalledWith(estudiante);
    expect(resumen).toHaveBeenCalledTimes(1);
    expect(resumen.mock.calls[0]).toHaveLength(1);
  });

  it('devuelve la respuesta tal cual la resuelve el servicio', async () => {
    const respuesta = { rol: UserRole.STUDENT, proximaClase: null };
    const controller = new PanelController({
      resumen: vi.fn().mockResolvedValue(respuesta),
    } as unknown as PanelService);

    await expect(controller.resumen(estudiante)).resolves.toEqual(respuesta);
  });
});
