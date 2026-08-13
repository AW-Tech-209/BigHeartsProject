import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserRole, UserStatus } from '@academia/types';

import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_TOKEN_BYTES } from './auth.constants';
import { invalidRefreshToken } from './auth.errors';
import type { JwtPayload } from './auth.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Datos mínimos del usuario que necesita el Access Token. */
type AccessTokenSubject = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

/**
 * Emisión y validación de tokens de sesión (HU-102).
 *
 * Dos piezas independientes:
 *  - Access Token: JWT firmado, de vida corta (config `JWT_ACCESS_EXPIRES_IN`).
 *    Stateless: se verifica por firma, sin tocar la BD.
 *  - Refresh Token: cadena opaca de alta entropía, de vida larga. En la BD solo
 *    se guarda su HASH (SHA-256); el valor en claro solo lo tiene el cliente
 *    (en su cookie httpOnly). Cada uso lo ROTA (revoca el viejo, emite uno nuevo).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Firma un Access Token JWT para el usuario. El `expiresIn` se deriva del
   * propio token (exp - iat) para que siempre cuadre con lo que se firmó, sea
   * cual sea el formato configurado.
   */
  issueAccessToken(user: AccessTokenSubject): { token: string; expiresIn: number } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    const token = this.jwt.sign(payload);
    const decoded = this.jwt.decode(token) as { exp: number; iat: number };

    return { token, expiresIn: decoded.exp - decoded.iat };
  }

  /**
   * Emite un refresh token nuevo para un usuario y persiste solo su hash.
   * Devuelve el valor EN CLARO (única vez que existe) para ponerlo en la cookie.
   */
  async issueRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateOpaqueToken();
    const expiresAt = this.nextExpiry();

    await this.prisma.refreshToken.create({
      data: { tokenHash: this.hashToken(token), userId, expiresAt },
    });

    return { token, expiresAt };
  }

  /**
   * Valida un refresh token en claro. Devuelve el id de registro y el usuario
   * dueño si es válido; lanza `INVALID_REFRESH_TOKEN` si no.
   *
   * Detección de reuso: si el token existe pero YA estaba revocado, se asume que
   * fue robado (alguien está reusando un token rotado) y se revoca toda la
   * familia de sesiones activas del usuario como medida defensiva.
   */
  async verifyRefreshToken(rawToken: string): Promise<{ id: string; userId: string }> {
    const tokenHash = this.hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw invalidRefreshToken();
    }

    if (existing.revokedAt) {
      await this.revokeAllForUser(existing.userId);
      throw invalidRefreshToken();
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw invalidRefreshToken();
    }

    return { id: existing.id, userId: existing.userId };
  }

  /**
   * Rota un refresh token ya validado: en una transacción, revoca el registro
   * usado y emite uno nuevo. Devuelve el valor en claro del nuevo token.
   */
  async rotateRefreshToken(
    recordId: string,
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateOpaqueToken();
    const expiresAt = this.nextExpiry();

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: recordId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: { tokenHash: this.hashToken(token), userId, expiresAt },
      }),
    ]);

    return { token, expiresAt };
  }

  /**
   * Revoca un refresh token (logout). Idempotente: si no existe o ya estaba
   * revocado, no hace nada ni lanza.
   */
  async revokeRefreshToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoca TODAS las sesiones activas de un usuario (reuso detectado). */
  private async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private generateOpaqueToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  private nextExpiry(): Date {
    return new Date(Date.now() + this.config.refreshTokenTtlDays * MS_PER_DAY);
  }

  /** SHA-256 en hex. El token es de alta entropía, no necesita bcrypt/salt. */
  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
