import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import bcrypt from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { TokenService } from '../auth/token.service';
import { generarContrasenaTemporal } from '../common/contrasena-temporal';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminUsuariosController } from './admin-usuarios.controller';
import { AdminUsuariosService } from './admin-usuarios.service';
import type { CrearUsuarioDto } from './dto/crear-usuario.dto';

const NOW = new Date('2026-09-30T10:00:00Z');

function fila(over: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    email: 'ana@x.co',
    firstName: 'Ana',
    lastName: 'Ruiz',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    hearingLossLevel: null,
    preferredInstructionMode: null,
    preferredSupports: [],
    mustChangePassword: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

function setup(existing: unknown = null) {
  const create = vi.fn(async ({ data }) => fila({ ...data }));
  const update = vi.fn(async ({ data }) => fila({ ...data }));
  const findUnique = vi.fn().mockResolvedValue(existing);
  const findMany = vi.fn().mockResolvedValue([fila()]);
  const revokeAllForUser = vi.fn().mockResolvedValue(undefined);
  const prisma = {
    user: { create, update, findUnique, findMany, count: vi.fn().mockResolvedValue(1) },
  } as unknown as PrismaService;
  const service = new AdminUsuariosService(prisma, { revokeAllForUser } as unknown as TokenService);
  return { service, create, update, findMany, revokeAllForUser };
}

const dto = {
  firstName: 'Ana',
  lastName: 'Ruiz',
  email: 'ana@x.co',
  role: UserRole.TEACHER,
} as CrearUsuarioDto;

describe('generarContrasenaTemporal', () => {
  it('no usa caracteres ambiguos y cumple la regla de contraseña (1 000 veces)', () => {
    for (let i = 0; i < 1000; i++) {
      const p = generarContrasenaTemporal();
      expect(p).toMatch(/^[A-Za-z0-9]{4}(-[A-Za-z0-9]{4}){2}$/);
      expect(p).not.toMatch(/[0OolIl1]/);
      expect(p).toMatch(/(?=.*[A-Za-z])(?=.*\d)/);
    }
  });
});

describe('AdminUsuariosService', () => {
  it('crea la cuenta ACTIVE, devuelve la contraseña y guarda solo un hash que la valida', async () => {
    const { service, create } = setup();

    const res = await service.create(dto);
    const data = create.mock.calls[0][0].data;

    expect(data.status).toBe(UserStatus.ACTIVE);
    expect(data.mustChangePassword).toBe(true);
    expect(data.password).not.toBe(res.contrasenaTemporal);
    expect(await bcrypt.compare(res.contrasenaTemporal, data.password)).toBe(true);
    expect(res.usuario).not.toHaveProperty('password');
    const dias = (new Date(res.caducaEl).getTime() - Date.now()) / 86_400_000;
    expect(dias).toBeGreaterThan(6.9);
    expect(dias).toBeLessThanOrEqual(7);
  });

  it('correo repetido → 409', async () => {
    const { service } = setup({ id: 'x' });

    await expect(service.create(dto)).rejects.toMatchObject({
      response: { code: ApiErrorCode.EMAIL_ALREADY_EXISTS },
    });
  });

  it('el reset revoca todas las sesiones y no aplica a ADMIN', async () => {
    const ok = setup(fila());
    await ok.service.resetTemporaryPassword('u1');
    expect(ok.revokeAllForUser).toHaveBeenCalledWith('u1');

    const admin = setup(fila({ role: UserRole.ADMIN }));
    await expect(admin.service.resetTemporaryPassword('a1')).rejects.toBeDefined();
    expect(admin.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('el listado no expone password ni hashes', async () => {
    const { service, findMany } = setup();

    const res = await service.list({});

    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('password');
    expect(JSON.stringify(res)).not.toMatch(/password/i);
    expect(res.items[0].pendienteDePrimerIngreso).toBe(true);
  });
});

describe('AdminUsuariosController — autorización', () => {
  const guard = new RolesGuard(new Reflector());
  const puede = (role: UserRole, handler: () => unknown) =>
    guard.canActivate({
      getHandler: () => handler,
      getClass: () => AdminUsuariosController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u', role } as AuthenticatedUser }),
      }),
    } as unknown as ExecutionContext);
  const handlers = [
    AdminUsuariosController.prototype.list,
    AdminUsuariosController.prototype.create,
    AdminUsuariosController.prototype.resetPassword,
  ];

  it.each([UserRole.STUDENT, UserRole.TEACHER])('%s recibe 403 en todos los endpoints', (rol) => {
    for (const h of handlers) expect(() => puede(rol, h)).toThrow();
  });

  it('ADMIN pasa', () => {
    for (const h of handlers) expect(puede(UserRole.ADMIN, h)).toBe(true);
  });
});
