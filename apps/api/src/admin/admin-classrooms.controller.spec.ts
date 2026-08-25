import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminClassroomsController } from './admin-classrooms.controller';
import type { AdminClassroomsService } from './admin-classrooms.service';
import type { ListAdminClassroomsDto } from './dto/list-admin-classrooms.dto';

function setup() {
  const listAll = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  const service = { listAll } as unknown as AdminClassroomsService;

  return { controller: new AdminClassroomsController(service), listAll };
}

describe('AdminClassroomsController — forma de la respuesta', () => {
  it('GET /admin/classrooms devuelve tal cual lo que resuelve el servicio', async () => {
    const { controller, listAll } = setup();
    const query = {} as ListAdminClassroomsDto;

    await expect(controller.list(query)).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    expect(listAll).toHaveBeenCalledWith(query);
  });
});

/**
 * AC3 — un `STUDENT` y un `TEACHER` reciben 403, comprobado con el `RolesGuard`
 * real contra la clase real, no con el Reflector mockeado.
 */
describe('AdminClassroomsController — autorización por rol (AC3)', () => {
  const guard = new RolesGuard(new Reflector());

  function contextoPara(role: UserRole): ExecutionContext {
    const user: AuthenticatedUser = {
      id: `id-${role}`,
      email: 'u@academia.local',
      role,
      status: UserStatus.ACTIVE,
    };

    return {
      getHandler: () => AdminClassroomsController.prototype.list,
      getClass: () => AdminClassroomsController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('deja pasar a ADMIN', () => {
    expect(guard.canActivate(contextoPara(UserRole.ADMIN))).toBe(true);
  });

  it.each([UserRole.STUDENT, UserRole.TEACHER])('responde 403 a %s', (role) => {
    const contexto = contextoPara(role);

    expect(() => guard.canActivate(contexto)).toThrowError();

    try {
      guard.canActivate(contexto);
    } catch (error) {
      const excepcion = error as { getStatus: () => number; getResponse: () => { code: string } };
      expect(excepcion.getStatus()).toBe(403);
      expect(excepcion.getResponse().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
    }
  });
});
