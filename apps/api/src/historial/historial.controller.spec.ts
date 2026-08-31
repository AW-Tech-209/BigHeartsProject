import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HistorialController } from './historial.controller';
import type { HistorialService } from './historial.service';

const estudiante: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

function contextoDeRol(role: UserRole): ExecutionContext {
  const user: AuthenticatedUser = {
    id: `id-${role}`,
    email: 'u@academia.local',
    role,
    status: UserStatus.ACTIVE,
  };

  return {
    getHandler: () => HistorialController.prototype.list,
    getClass: () => HistorialController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('HistorialController.list — GET /historial (HU-404)', () => {
  it('pasa al servicio el usuario del token y el query', async () => {
    const listHistorial = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const controller = new HistorialController({ listHistorial } as unknown as HistorialService);
    const query = { resultado: 'ATTENDED' } as never;

    await controller.list(estudiante, query);

    expect(listHistorial).toHaveBeenCalledWith(estudiante, query);
  });

  it('devuelve la respuesta tal cual la resuelve el servicio', async () => {
    const respuesta = { items: [], total: 0, page: 1, pageSize: 20 };
    const listHistorial = vi.fn().mockResolvedValue(respuesta);
    const controller = new HistorialController({ listHistorial } as unknown as HistorialService);

    await expect(controller.list(estudiante, {} as never)).resolves.toEqual(respuesta);
  });

  /** AC3 — el alcance sale del token; el `ADMIN` no entra aquí (§ Contexto de la HU). */
  describe('autorización por rol (AC3)', () => {
    const guard = new RolesGuard(new Reflector());

    it.each([UserRole.STUDENT, UserRole.TEACHER])('deja pasar a %s', (role) => {
      expect(guard.canActivate(contextoDeRol(role))).toBe(true);
    });

    it('responde 403 INSUFFICIENT_ROLE a ADMIN', () => {
      try {
        guard.canActivate(contextoDeRol(UserRole.ADMIN));
        throw new Error('Se esperaba un 403 y el guard dejó pasar.');
      } catch (error) {
        const excepcion = error as {
          getStatus?: () => number;
          getResponse?: () => { code: string };
        };
        expect(excepcion.getStatus?.()).toBe(403);
        expect(excepcion.getResponse?.().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
      }
    });
  });
});
