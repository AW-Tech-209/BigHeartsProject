import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminMetricasController } from './admin-metricas.controller';
import { AdminMetricasService } from './admin-metricas.service';

describe('AdminMetricasController — autorización por rol (AC1)', () => {
  const guard = new RolesGuard(new Reflector());

  function contextoPara(role: UserRole): ExecutionContext {
    const user: AuthenticatedUser = {
      id: `id-${role}`,
      email: 'u@academia.local',
      role,
      status: UserStatus.ACTIVE,
    };

    return {
      getHandler: () => AdminMetricasController.prototype.obtener,
      getClass: () => AdminMetricasController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('deja pasar a ADMIN', () => {
    expect(guard.canActivate(contextoPara(UserRole.ADMIN))).toBe(true);
  });

  it.each([UserRole.STUDENT, UserRole.TEACHER])('responde 403 a %s', (role) => {
    try {
      guard.canActivate(contextoPara(role));
      expect.unreachable();
    } catch (error) {
      const excepcion = error as { getStatus: () => number; getResponse: () => { code: string } };
      expect(excepcion.getStatus()).toBe(403);
      expect(excepcion.getResponse().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
    }
  });
});

describe('AdminMetricasService — rango inválido', () => {
  const queryRaw = vi.fn();
  const service = new AdminMetricasService(
    { $queryRaw: queryRaw } as unknown as PrismaService,
    { academyTimezone: 'America/Bogota' } as AppConfigService,
  );

  it.each([
    ['fecha inexistente', { desde: '2026-02-30', hasta: '2026-03-05' }],
    ['inicio posterior al fin', { desde: '2026-03-10', hasta: '2026-03-01' }],
    ['más de 366 días', { desde: '2025-01-01', hasta: '2026-01-02' }],
  ])('responde 400 con %s, sin tocar la BD', async (_caso, query) => {
    await expect(service.obtener(query)).rejects.toMatchObject({ status: 400 });
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
