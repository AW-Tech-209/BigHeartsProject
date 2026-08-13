import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';

type FakeRequest = { headers: Record<string, string>; user?: AuthenticatedUser };

/** Monta el guard con un Reflector y un JwtService mockeados. */
function setup(options: { isPublic?: boolean; authHeader?: string; verifyThrows?: boolean }) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(options.isPublic ?? false),
  } as unknown as Reflector;

  const verify = vi.fn(() => {
    if (options.verifyThrows) throw new Error('bad token');
    return {
      sub: 'user-id',
      email: 'u@a.local',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    };
  });
  const jwt = { verify } as unknown as JwtService;

  const request: FakeRequest = {
    headers: options.authHeader ? { authorization: options.authHeader } : {},
  };
  const context = {
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { guard: new JwtAuthGuard(reflector, jwt), context, request, verify };
}

beforeEach(() => vi.clearAllMocks());

describe('JwtAuthGuard', () => {
  it('deja pasar rutas @Public sin exigir token', () => {
    const { guard, context, verify } = setup({ isPublic: true });

    expect(guard.canActivate(context)).toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rechaza sin cabecera Authorization con UNAUTHENTICATED', () => {
    const { guard, context } = setup({});

    expect(() => guard.canActivate(context)).toThrowError(UnauthorizedException);
    try {
      guard.canActivate(context);
    } catch (error) {
      expect((error as UnauthorizedException).getResponse()).toMatchObject({
        code: ApiErrorCode.UNAUTHENTICATED,
      });
    }
  });

  it('rechaza una cabecera sin esquema Bearer', () => {
    const { guard, context } = setup({ authHeader: 'Token abc' });
    expect(() => guard.canActivate(context)).toThrowError(UnauthorizedException);
  });

  it('rechaza un token que no verifica (firma inválida o expirado)', () => {
    const { guard, context } = setup({ authHeader: 'Bearer bad', verifyThrows: true });
    expect(() => guard.canActivate(context)).toThrowError(UnauthorizedException);
  });

  it('acepta un token válido y adjunta el usuario a request.user', () => {
    const { guard, context, request } = setup({ authHeader: 'Bearer good' });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({
      id: 'user-id',
      email: 'u@a.local',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
  });
});
