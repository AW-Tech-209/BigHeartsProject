import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

function setup() {
  const sign = vi.fn(() => 'signed.jwt.token');
  // exp - iat = 900 s (15 min).
  const decode = vi.fn(() => ({ iat: 1_000, exp: 1_900 }));
  const jwt = { sign, decode } as unknown as JwtService;

  const refreshToken = {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'rt-new',
      ...data,
    })),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(async (_args: unknown) => ({ count: 1 })),
  };
  const $transaction = vi.fn(async (ops: unknown[]) => ops);
  const prisma = { refreshToken, $transaction } as unknown as PrismaService;

  const config = { refreshTokenTtlDays: 30 } as AppConfigService;

  return {
    service: new TokenService(jwt, prisma, config),
    sign,
    decode,
    refreshToken,
    $transaction,
  };
}

const subject = {
  id: 'user-id',
  email: 'user@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

beforeEach(() => vi.clearAllMocks());

describe('TokenService.issueAccessToken', () => {
  it('firma el payload con sub/email/role/status y deriva expiresIn del token', () => {
    const { service, sign } = setup();

    const result = service.issueAccessToken(subject);

    expect(result.token).toBe('signed.jwt.token');
    expect(result.expiresIn).toBe(900);
    expect(sign).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'user@academia.local',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
  });
});

describe('TokenService.issueRefreshToken', () => {
  it('persiste solo el HASH y devuelve el token en claro con caducidad futura', async () => {
    const { service, refreshToken } = setup();

    const { token, expiresAt } = await service.issueRefreshToken('user-id');

    const data = refreshToken.create.mock.calls[0]![0].data as Record<string, string>;
    // Nunca se guarda el token en claro: solo su hash SHA-256 (64 hex).
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.tokenHash).not.toBe(token);
    expect(data.userId).toBe('user-id');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('TokenService.verifyRefreshToken', () => {
  it('lanza INVALID_REFRESH_TOKEN si no existe', async () => {
    const { service, refreshToken } = setup();
    refreshToken.findUnique.mockResolvedValue(null);

    await expect(service.verifyRefreshToken('raw')).rejects.toMatchObject({
      response: { code: ApiErrorCode.INVALID_REFRESH_TOKEN },
    });
  });

  it('detecta reuso: si el token estaba revocado, revoca TODA la familia y lanza', async () => {
    const { service, refreshToken } = setup();
    refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-id',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 10_000),
    });

    await expect(service.verifyRefreshToken('raw')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('lanza si el token está caducado', async () => {
    const { service, refreshToken } = setup();
    refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-id',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(service.verifyRefreshToken('raw')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('devuelve id y userId cuando es válido', async () => {
    const { service, refreshToken } = setup();
    refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-id',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10_000),
    });

    await expect(service.verifyRefreshToken('raw')).resolves.toEqual({
      id: 'rt-1',
      userId: 'user-id',
    });
  });
});

describe('TokenService.rotateRefreshToken', () => {
  it('revoca el usado y crea uno nuevo en una transacción', async () => {
    const { service, refreshToken, $transaction } = setup();

    const { token } = await service.rotateRefreshToken('rt-1', 'user-id');

    expect($transaction).toHaveBeenCalledOnce();
    expect(refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(token).toMatch(/.+/);
  });
});

describe('TokenService.revokeRefreshToken', () => {
  it('revoca por hash solo los tokens activos (idempotente)', async () => {
    const { service, refreshToken } = setup();

    await service.revokeRefreshToken('raw');

    const arg = refreshToken.updateMany.mock.calls[0]![0] as {
      where: { tokenHash: string; revokedAt: null };
    };
    expect(arg.where.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(arg.where.revokedAt).toBeNull();
  });
});
