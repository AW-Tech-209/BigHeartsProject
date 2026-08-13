import { ConflictException } from '@nestjs/common';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';

// bcrypt real es lento (coste 12) y no es lo que probamos aquí: lo mockeamos
// para que los tests sean rápidos y deterministas.
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(async (value: string) => `hashed:${value}`) },
}));

/** Construye un AuthService con Prisma y config mockeados. */
function setup(options: { teacherApprovalRequired?: boolean; existingEmail?: boolean } = {}) {
  const findUnique = vi
    .fn()
    .mockResolvedValue(options.existingEmail ? { id: 'existing-id' } : null);
  // create devuelve lo que le pasan más los campos que rellena la BD.
  const create = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
    id: 'new-id',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...data,
  }));

  const prisma = { user: { findUnique, create } } as unknown as PrismaService;
  const config = {
    teacherApprovalRequired: options.teacherApprovalRequired ?? true,
  } as AppConfigService;

  return { service: new AuthService(prisma, config), findUnique, create };
}

/** DTO base ya "normalizado" (como lo dejaría el ValidationPipe). */
function baseDto(overrides: Partial<RegisterDto> = {}): RegisterDto {
  return {
    email: 'nuevo@academia.local',
    password: 'Password123',
    firstName: 'Nombre',
    lastName: 'Apellido',
    role: UserRole.STUDENT,
    ...overrides,
  } as RegisterDto;
}

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra un estudiante con estado ACTIVE', async () => {
    const { service, create } = setup();

    const user = await service.register(baseDto({ role: UserRole.STUDENT }));

    expect(user.role).toBe(UserRole.STUDENT);
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(create).toHaveBeenCalledOnce();
  });

  it('registra un profesor con estado PENDING cuando la aprobación está activa', async () => {
    const { service } = setup({ teacherApprovalRequired: true });

    const user = await service.register(baseDto({ role: UserRole.TEACHER }));

    expect(user.status).toBe(UserStatus.PENDING);
  });

  it('registra un profesor con estado ACTIVE cuando la aprobación está desactivada', async () => {
    const { service } = setup({ teacherApprovalRequired: false });

    const user = await service.register(baseDto({ role: UserRole.TEACHER }));

    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('guarda la contraseña hasheada, nunca en claro, y no la devuelve', async () => {
    const { service, create } = setup();

    const user = await service.register(baseDto({ password: 'Password123' }));

    const created = create.mock.calls[0][0].data;
    expect(created.password).toBe('hashed:Password123');
    expect(created.password).not.toBe('Password123');
    // La vista pública NUNCA incluye password.
    expect(user).not.toHaveProperty('password');
  });

  it('rechaza un email ya registrado con 409 EMAIL_ALREADY_EXISTS', async () => {
    const { service, create } = setup({ existingEmail: true });

    await expect(service.register(baseDto())).rejects.toBeInstanceOf(ConflictException);
    await expect(service.register(baseDto())).rejects.toMatchObject({
      response: { code: ApiErrorCode.EMAIL_ALREADY_EXISTS },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('persiste las preferencias de accesibilidad', async () => {
    const { service, create } = setup();

    await service.register(
      baseDto({
        hearingLossLevel: undefined,
        communicationPreference: undefined,
      }),
    );

    const created = create.mock.calls[0][0].data;
    // Sin declarar → se guardan como null, no undefined.
    expect(created.hearingLossLevel).toBeNull();
    expect(created.communicationPreference).toBeNull();
  });
});
