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

  const userUpdate = vi.fn().mockResolvedValue(undefined);
  const resetToken = {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'prt-id' }),
    update: vi.fn().mockResolvedValue(undefined),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const refreshTokenModel = { updateMany: vi.fn().mockResolvedValue({ count: 0 }) };
  const prisma = {
    user: { findUnique, create, update: userUpdate },
    passwordResetToken: resetToken,
    refreshToken: refreshTokenModel,
  } as unknown as PrismaService;
  (prisma as unknown as { $transaction: unknown }).$transaction = vi.fn(async (arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );

  const config = {
    teacherApprovalRequired: options.teacherApprovalRequired ?? true,
    passwordResetExpiryMinutes: 30,
    frontendUrl: 'https://academia-web.vercel.app',
  } as AppConfigService;

  const notify = vi.fn().mockResolvedValue({ delivered: true, channel: 'email' });
  const notifications = {
    notify,
  } as unknown as import('../notifications/notification.service').NotificationService;

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
    service: new AuthService(prisma, config, tokens, notifications),
    findUnique,
    create,
    userUpdate,
    resetToken,
    refreshTokenModel,
    notify,
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

  // AC3 de la HU-104. El código y el mensaje son PROPIOS: a un profesor
  // rechazado no se le puede decir que su cuenta está suspendida, porque nunca
  // llegó a estar activa (D13).
  it('rechaza una cuenta REJECTED con 403 ACCOUNT_REJECTED', async () => {
    const { service } = setup({ foundUser: dbUser({ status: UserStatus.REJECTED }) });

    await expect(service.login(loginDto())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.login(loginDto())).rejects.toMatchObject({
      response: { code: ApiErrorCode.ACCOUNT_REJECTED },
    });
  });

  it('el mensaje de REJECTED es distinto del de SUSPENDED (AC3)', async () => {
    const { service: rechazada } = setup({ foundUser: dbUser({ status: UserStatus.REJECTED }) });
    const { service: suspendida } = setup({ foundUser: dbUser({ status: UserStatus.SUSPENDED }) });

    const mensaje = async (servicio: typeof rechazada): Promise<string> => {
      try {
        await servicio.login(loginDto());
      } catch (error) {
        return ((error as ForbiddenException).getResponse() as { message: string }).message;
      }
      throw new Error('Se esperaba un rechazo y no lo hubo.');
    };

    expect(await mensaje(rechazada)).not.toBe(await mensaje(suspendida));
    expect(await mensaje(rechazada)).not.toMatch(/suspendida/i);
  });

  // Un profesor aprobado entra con normalidad: es la otra mitad del AC2. La
  // primera mitad (que el estado pase a ACTIVE) vive en `admin.service.spec.ts`.
  it('un profesor ACTIVE inicia sesión sin que el estado lo bloquee (AC2)', async () => {
    const { service } = setup({
      foundUser: dbUser({ role: UserRole.TEACHER, status: UserStatus.ACTIVE }),
    });

    await expect(service.login(loginDto())).resolves.toMatchObject({
      session: { accessToken: 'access-jwt' },
    });
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

describe('AuthService.requestPasswordReset', () => {
  it('con email registrado y ACTIVE: invalida los tokens previos, crea uno y notifica una vez (AC1)', async () => {
    const { service, resetToken, notify } = setup({ foundUser: dbUser() });

    await service.requestPasswordReset({ email: 'user@academia.local' });

    expect(resetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(resetToken.create).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledOnce();
  });

  it('en BD solo guarda el hash SHA-256 del token, nunca el token en claro (AC4)', async () => {
    const { service, resetToken, notify } = setup({ foundUser: dbUser() });

    await service.requestPasswordReset({ email: 'user@academia.local' });

    const tokenHash = resetToken.create.mock.calls[0]![0].data.tokenHash as string;
    const enlace = notify.mock.calls[0]![0].resetUrl as string;
    const rawToken = new URL(enlace).searchParams.get('token')!;

    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toBe(rawToken);
    expect(enlace).not.toContain(tokenHash);
  });

  it('con email inexistente no crea token ni notifica, y no lanza (AC1)', async () => {
    const { service, resetToken, notify } = setup({ foundUser: null });

    await expect(
      service.requestPasswordReset({ email: 'nadie@academia.local' }),
    ).resolves.toBeUndefined();
    expect(resetToken.create).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('con una cuenta que no está ACTIVE tampoco crea token ni notifica', async () => {
    const { service, resetToken, notify } = setup({
      foundUser: dbUser({ status: UserStatus.SUSPENDED }),
    });

    await service.requestPasswordReset({ email: 'user@academia.local' });

    expect(resetToken.create).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  const validRecord = () => ({
    id: 'prt-id',
    userId: 'user-id',
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  });

  it('cambia el hash, marca el token usado y revoca todas las sesiones (AC2)', async () => {
    const { service, resetToken, userUpdate, refreshTokenModel } = setup();
    resetToken.findUnique.mockResolvedValue(validRecord());

    await service.resetPassword({ token: 'raw-reset-token', password: 'NuevaPass123' });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { password: 'hashed:NuevaPass123' },
    });
    expect(resetToken.update).toHaveBeenCalledWith({
      where: { id: 'prt-id' },
      data: { usedAt: expect.any(Date) },
    });
    expect(refreshTokenModel.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('token inexistente → PASSWORD_RESET_TOKEN_INVALID (AC3)', async () => {
    const { service } = setup();

    await expect(
      service.resetPassword({ token: 'x', password: 'NuevaPass123' }),
    ).rejects.toMatchObject({ response: { code: ApiErrorCode.PASSWORD_RESET_TOKEN_INVALID } });
  });

  it('token ya usado → PASSWORD_RESET_TOKEN_INVALID (AC3)', async () => {
    const { service, resetToken } = setup();
    resetToken.findUnique.mockResolvedValue({ ...validRecord(), usedAt: new Date() });

    await expect(
      service.resetPassword({ token: 'x', password: 'NuevaPass123' }),
    ).rejects.toMatchObject({ response: { code: ApiErrorCode.PASSWORD_RESET_TOKEN_INVALID } });
  });

  it('token caducado → PASSWORD_RESET_TOKEN_EXPIRED (AC3)', async () => {
    const { service, resetToken, userUpdate } = setup();
    resetToken.findUnique.mockResolvedValue({
      ...validRecord(),
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.resetPassword({ token: 'x', password: 'NuevaPass123' }),
    ).rejects.toMatchObject({ response: { code: ApiErrorCode.PASSWORD_RESET_TOKEN_EXPIRED } });
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
