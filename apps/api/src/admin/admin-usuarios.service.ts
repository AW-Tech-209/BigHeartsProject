import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import {
  type AdminUsuariosResponse,
  ApiErrorCode,
  CLASSROOMS_PAGE_SIZE_DEFAULT,
  CONTRASENA_TEMPORAL_DIAS,
  type CuentaCreadaResponse,
  UserRole,
  UserStatus,
} from '@academia/types';
import type { Prisma } from '@prisma/client';

import { BCRYPT_SALT_ROUNDS } from '../auth/auth.constants';
import { TokenService } from '../auth/token.service';
import { generarContrasenaTemporal } from '../common/contrasena-temporal';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/user.mapper';
import { adminAccountNotAllowed, usuarioNotFound } from './admin.errors';
import type { CrearUsuarioDto } from './dto/crear-usuario.dto';
import type { ListAdminUsuariosDto } from './dto/list-admin-usuarios.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminUsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  /** La cuenta nace `ACTIVE`: que el admin la cree es la aprobación (D49). */
  async create(dto: CrearUsuarioDto): Promise<CuentaCreadaResponse> {
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

    const { plain, hash, expiresAt } = await this.newTemporaryPassword();
    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.ACTIVE,
        password: hash,
        mustChangePassword: true,
        temporaryPasswordExpiresAt: expiresAt,
      },
    });

    return {
      usuario: toPublicUser(created),
      contrasenaTemporal: plain,
      caducaEl: expiresAt.toISOString(),
    };
  }

  async resetTemporaryPassword(id: string): Promise<CuentaCreadaResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw usuarioNotFound();
    if (user.role === UserRole.ADMIN) throw adminAccountNotAllowed();

    const { plain, hash, expiresAt } = await this.newTemporaryPassword();
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hash, mustChangePassword: true, temporaryPasswordExpiresAt: expiresAt },
    });
    await this.tokens.revokeAllForUser(id);

    return {
      usuario: toPublicUser(updated),
      contrasenaTemporal: plain,
      caducaEl: expiresAt.toISOString(),
    };
  }

  async list(query: ListAdminUsuariosDto): Promise<AdminUsuariosResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;

    const where: Prisma.UserWhereInput = {
      ...(query.rol ? { role: query.rol } : {}),
      ...(query.estado ? { status: query.estado } : {}),
      ...(query.q
        ? {
            OR: [
              { firstName: { contains: query.q, mode: 'insensitive' } },
              { lastName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map(({ mustChangePassword, createdAt, role, status, ...rest }) => ({
        ...rest,
        role: role as UserRole,
        status: status as UserStatus,
        pendienteDePrimerIngreso: mustChangePassword,
        createdAt: createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  private async newTemporaryPassword() {
    const plain = generarContrasenaTemporal();
    return {
      plain,
      hash: await bcrypt.hash(plain, BCRYPT_SALT_ROUNDS),
      expiresAt: new Date(Date.now() + CONTRASENA_TEMPORAL_DIAS * MS_PER_DAY),
    };
  }
}
