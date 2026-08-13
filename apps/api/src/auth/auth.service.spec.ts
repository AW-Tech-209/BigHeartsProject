import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { TokenService } from './token.service';

// bcrypt real es lento (coste 12) y no es lo que probamos aquí: lo mockeamos
// para que los tests sean rápidos y deterministas.
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed:${value}`),
    compare: vi.fn(async () => true),
  },
}));

const mockedCompare = vi.mocked(bcrypt.compare);

/** Usuario "de BD" (entidad Prisma) con contraseña, para los tests de login. */
function dbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'user@academia.local',
    password: 'hashed:Password123',
    firstName: 'Nombre',
    lastName: 'Apellido',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Construye un AuthService con Prisma, config y tokens mockeados. */
function setup(
  options: {
    teacherApprovalRequired?: boolean;
    existingEmail?: boolean;
    foundUser?: ReturnType<typeof dbUser> | null;
  } = {},
) {
  const findUnique = vi
    .fn()
    .mockResolvedValue(
      'foundUser' in options
        ? options.foundUser
        : options.existingEmail
          ? { id: 'existing-id' }
          : null,
    );
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

  const tokens = {
    issueAccessToken: vi.fn(() => ({ token: 'access-jwt', expiresIn: 900 })),
    issueRefreshToken: vi.fn(async () => ({
      token: 'refresh-raw',
      expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    })),
    verifyRefreshToken: vi.fn(async () => ({ id: 'rt-id', userId: 'user-id' })),
    rotateRefreshToken: vi.fn(async () => ({
      token: 'refresh-new',
      expiresAt: new Date('2026-02-02T00:00:00.000Z'),
    })),
    revokeRefreshToken: vi.fn(async () => undefined),
  } as unknown as TokenService;

  return {
    service: new AuthService(prisma, config, tokens),
    findUnique,
    create,
    tokens: tokens as unknown as Record<string, ReturnType<typeof vi.fn>>,
  };
}

/** DTO de registro base ya "normalizado" (como lo dejaría el ValidationPipe). */
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

const loginDto = (overrides: Partial<LoginDto> = {}): LoginDto =>
  ({ email: 'user@academia.local', password: 'Password123', ...overrides }) as LoginDto;

beforeEach(() => {
  vi.clearAllMocks();
  mockedCompare.mockResolvedValue(true as never);
});

describe('AuthService.register', () => {
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

    const created = create.mock.calls[0]![0].data;
    expect(created.password).toBe('hashed:Password123');
    expect(created.password).not.toBe('Password123');
    expect(user).not.toHaveProperty('password');
  });

  it('rechaza un email ya registrado con 409 EMAIL_ALREADY_EXISTS', async () => {
    const { service, create } = setup({ existingEmail: true });

    await expect(service.register(baseDto())).rejects.toMatchObject({
      response: { code: ApiErrorCode.EMAIL_ALREADY_EXISTS },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('persiste las preferencias de accesibilidad', async () => {
    const { service, create } = setup();

    await service.register(
      baseDto({ hearingLossLevel: undefined, communicationPreference: undefined }),
    );

    const created = create.mock.calls[0]![0].data;
    expect(created.hearingLossLevel).toBeNull();
    expect(created.communicationPreference).toBeNull();
  });
});

describe('AuthService.login', () => {
  it('emite access + refresh para credenciales válidas de una cuenta ACTIVE', async () => {
    const { service, tokens } = setup({ foundUser: dbUser() });

    const issued = await service.login(loginDto());

    expect(issued.session.accessToken).toBe('access-jwt');
    expect(issued.session.expiresIn).toBe(900);
    expect(issued.refreshToken).toBe('refresh-raw');
    expect(tokens.issueRefreshToken).toHaveBeenCalledWith('user-id');
    // La sesión nunca lleva la contraseña.
    expect(issued.session.user).not.toHaveProperty('password');
  });

  it('rechaza contraseña incorrecta con 401 INVALID_CREDENTIALS', async () => {
    const { service, tokens } = setup({ foundUser: dbUser() });
    mockedCompare.mockResolvedValue(false as never);

    await expect(service.login(loginDto())).rejects.toMatchObject({
      response: { code: ApiErrorCode.INVALID_CREDENTIALS },
    });
    expect(tokens.issueRefreshToken).not.toHaveBeenCalled();
  });

  it('con email inexistente compara igual (anti-enumeración) y devuelve el mismo error', async () => {
    const { service } = setup({ foundUser: null });
    mockedCompare.mockResolvedValue(false as never);

    await expect(service.login(loginDto())).rejects.toBeInstanceOf(UnauthorizedException);
    // Se comparó contra el hash señuelo aunque el usuario no exista.
    expect(mockedCompare).toHaveBeenCalledOnce();
  });

  it('rechaza una cuenta SUSPENDED con 403 ACCOUNT_SUSPENDED', async () => {
    const { service } = setup({ foundUser: dbUser({ status: UserStatus.SUSPENDED }) });

    await expect(service.login(loginDto())).rejects.toMatchObject({
      response: { code: ApiErrorCode.ACCOUNT_SUSPENDED },
    });
  });

  it('rechaza una cuenta PENDING con 403 ACCOUNT_PENDING', async () => {
    const { service } = setup({ foundUser: dbUser({ status: UserStatus.PENDING }) });

    await expect(service.login(loginDto())).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AuthService.refresh', () => {
  it('rechaza cuando no hay refresh token', async () => {
    const { service } = setup();

    await expect(service.refresh(undefined)).rejects.toMatchObject({
      response: { code: ApiErrorCode.INVALID_REFRESH_TOKEN },
    });
  });

  it('valida, rota y emite una sesión nueva', async () => {
    const { service, tokens } = setup({ foundUser: dbUser() });

    const issued = await service.refresh('some-raw-token');

    expect(tokens.verifyRefreshToken).toHaveBeenCalledWith('some-raw-token');
    expect(tokens.rotateRefreshToken).toHaveBeenCalledWith('rt-id', 'user-id');
    expect(issued.refreshToken).toBe('refresh-new');
    expect(issued.session.accessToken).toBe('access-jwt');
  });

  it('no rota si el usuario fue suspendido tras el último login', async () => {
    const { service, tokens } = setup({ foundUser: dbUser({ status: UserStatus.SUSPENDED }) });

    await expect(service.refresh('some-raw-token')).rejects.toMatchObject({
      response: { code: ApiErrorCode.ACCOUNT_SUSPENDED },
    });
    expect(tokens.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('rechaza si el usuario ya no existe', async () => {
    const { service } = setup({ foundUser: null });

    await expect(service.refresh('some-raw-token')).rejects.toMatchObject({
      response: { code: ApiErrorCode.INVALID_REFRESH_TOKEN },
    });
  });
});

describe('AuthService.logout', () => {
  it('revoca el refresh token recibido', async () => {
    const { service, tokens } = setup();

    await service.logout('raw-token');

    expect(tokens.revokeRefreshToken).toHaveBeenCalledWith('raw-token');
  });
});
