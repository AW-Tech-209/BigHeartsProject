import { ConflictException, Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';
import {
  ApiErrorCode,
  type RegisterableRole,
  type User,
  UserRole,
  UserStatus,
} from '@academia/types';
import bcrypt from 'bcryptjs';

import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/user.mapper';
import { BCRYPT_SALT_ROUNDS, DECOY_PASSWORD_HASH } from './auth.constants';
import {
  accountPending,
  accountSuspended,
  invalidCredentials,
  invalidRefreshToken,
} from './auth.errors';
import type { IssuedSession } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Registra un usuario nuevo.
   *  - Rechaza emails ya existentes (409 EMAIL_ALREADY_EXISTS).
   *  - Hashea la contraseña con bcrypt (coste 12); nunca se guarda en claro.
   *  - Aplica la regla de estado inicial (ver `resolveInitialStatus`).
   *
   * Devuelve la vista pública del usuario (sin `password`).
   */
  async register(dto: RegisterDto): Promise<User> {
    // El DTO ya normaliza el email a minúsculas y recortado.
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        code: ApiErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'Ya existe una cuenta registrada con ese email.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: this.resolveInitialStatus(dto.role),
        hearingLossLevel: dto.hearingLossLevel ?? null,
        communicationPreference: dto.communicationPreference ?? null,
      },
    });

    return toPublicUser(created);
  }

  /**
   * Inicia sesión con email + contraseña.
   *  - Credenciales incorrectas → 401 INVALID_CREDENTIALS (mensaje genérico).
   *  - Cuenta SUSPENDED / PENDING → 403 con el código correspondiente.
   *  - OK → emite Access Token (JWT) + Refresh Token (opaco, en cookie).
   *
   * Anti-enumeración: si el email no existe, igualmente comparamos contra un
   * hash señuelo para que el tiempo de respuesta no delate qué emails existen.
   */
  async login(dto: LoginDto): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.password ?? DECOY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      throw invalidCredentials();
    }

    this.assertCanLogin(user);

    return this.issueSession(user);
  }

  /**
   * Renueva la sesión a partir del refresh token de la cookie.
   *  - Valida y ROTA el refresh token (el usado queda revocado).
   *  - Recomprueba el estado del usuario: si lo suspendieron o borraron desde el
   *    último login, la renovación falla (la suspensión surte efecto al renovar).
   *  - Emite un Access Token nuevo.
   */
  async refresh(rawToken: string | undefined): Promise<IssuedSession> {
    if (!rawToken) {
      throw invalidRefreshToken();
    }

    const record = await this.tokens.verifyRefreshToken(rawToken);

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw invalidRefreshToken();
    }
    this.assertCanLogin(user);

    const rotated = await this.tokens.rotateRefreshToken(record.id, user.id);
    const access = this.tokens.issueAccessToken(this.toAccessSubject(user));

    return {
      session: { user: toPublicUser(user), accessToken: access.token, expiresIn: access.expiresIn },
      refreshToken: rotated.token,
      refreshExpiresAt: rotated.expiresAt,
    };
  }

  /**
   * Cierra la sesión: revoca el refresh token para que no pueda volver a
   * renovarse. Idempotente (un token ya revocado o inexistente no da error).
   */
  async logout(rawToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(rawToken);
  }

  /**
   * Regla de negocio del estado inicial:
   *  - Estudiante → siempre ACTIVE.
   *  - Profesor   → PENDING si la aprobación está activada; si no, ACTIVE.
   */
  private resolveInitialStatus(role: RegisterableRole): UserStatus {
    if (role === UserRole.TEACHER && this.config.teacherApprovalRequired) {
      return UserStatus.PENDING;
    }

    return UserStatus.ACTIVE;
  }

  /** Solo las cuentas ACTIVE pueden iniciar o mantener sesión. */
  private assertCanLogin(user: Pick<PrismaUser, 'status'>): void {
    if (user.status === UserStatus.SUSPENDED) {
      throw accountSuspended();
    }
    if (user.status === UserStatus.PENDING) {
      throw accountPending();
    }
  }

  /** Emite una sesión completa (access + refresh) para un usuario ya validado. */
  private async issueSession(user: PrismaUser): Promise<IssuedSession> {
    const access = this.tokens.issueAccessToken(this.toAccessSubject(user));
    const refresh = await this.tokens.issueRefreshToken(user.id);

    return {
      session: { user: toPublicUser(user), accessToken: access.token, expiresIn: access.expiresIn },
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
    };
  }

  /** Proyecta la entidad de Prisma a lo mínimo que necesita el Access Token. */
  private toAccessSubject(user: Pick<PrismaUser, 'id' | 'email' | 'role' | 'status'>): {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  } {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    };
  }
}
