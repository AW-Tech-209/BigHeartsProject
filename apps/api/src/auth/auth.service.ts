import { ConflictException, Injectable } from '@nestjs/common';
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
import { BCRYPT_SALT_ROUNDS } from './auth.constants';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
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
}
