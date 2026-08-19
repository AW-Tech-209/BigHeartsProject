import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth.types';
import { RolesGuard } from './roles.guard';

/** Usuario tal como lo deja el JwtAuthGuard en `request.user`. */
function usuario(role: UserRole): AuthenticatedUser {
  return { id: `id-${role}`, email: 'u@academia.local', role, status: UserStatus.ACTIVE };
}

/** Monta el guard con el metadato de `@Roles` y el usuario que se le indiquen. */
function setup(options: { required?: UserRole[]; user?: AuthenticatedUser }) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(options.required),
  } as unknown as Reflector;

  const request = { user: options.user };
  const context = {
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { guard: new RolesGuard(reflector), context };
}

/** Extrae el `code` del cuerpo de la excepción, que es el contrato público. */
function codigoDe(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    const body = (error as ForbiddenException).getResponse() as { code: string };
    return body.code;
  }
  throw new Error('Se esperaba una excepción y no hubo ninguna.');
}

describe('RolesGuard', () => {
  it('deja pasar un endpoint sin @Roles, sea cual sea el rol', () => {
    const { guard, context } = setup({ required: undefined, user: usuario(UserRole.STUDENT) });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deja pasar un @Roles vacío (no autoriza a nadie por accidente ni cierra por accidente)', () => {
    const { guard, context } = setup({ required: [], user: usuario(UserRole.STUDENT) });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deja pasar cuando el rol del token está en la lista', () => {
    const { guard, context } = setup({
      required: [UserRole.ADMIN],
      user: usuario(UserRole.ADMIN),
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deja pasar cuando el rol es uno de varios permitidos', () => {
    const { guard, context } = setup({
      required: [UserRole.ADMIN, UserRole.TEACHER],
      user: usuario(UserRole.TEACHER),
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  // AC4 de la HU-104: la autorización se decide aquí, no ocultando la UI.
  it.each([UserRole.STUDENT, UserRole.TEACHER])(
    'rechaza a %s en un endpoint de ADMIN con INSUFFICIENT_ROLE',
    (role) => {
      const { guard, context } = setup({ required: [UserRole.ADMIN], user: usuario(role) });

      expect(() => guard.canActivate(context)).toThrowError(ForbiddenException);
      expect(codigoDe(() => guard.canActivate(context))).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
    },
  );

  it('sin usuario en la petición cierra en vez de abrir', () => {
    const { guard, context } = setup({ required: [UserRole.ADMIN], user: undefined });

    expect(() => guard.canActivate(context)).toThrowError(UnauthorizedException);
    expect(codigoDe(() => guard.canActivate(context))).toBe(ApiErrorCode.UNAUTHENTICATED);
  });
});
