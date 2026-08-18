import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { User } from '@academia/types';

import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { toPublicUser } from './user.mapper';
import { profileNotFound } from './users.errors';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve el perfil del usuario indicado, en su vista pública.
   *
   * El `userId` SIEMPRE viene del token (lo pone el JwtAuthGuard). El service no
   * tiene forma de saber quién pide qué, así que la única garantía de que nadie
   * lee un perfil ajeno es que el controller no acepte un id de la petición.
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw profileNotFound();
    }

    return toPublicUser(user);
  }

  /**
   * Actualiza los campos del perfil que el propio dueño puede cambiar.
   *
   * El `data` se arma campo a campo A PROPÓSITO: nunca se hace un spread del
   * DTO. Es la segunda barrera contra mass-assignment (la primera es el
   * `whitelist` del ValidationPipe global) y lo que garantiza que `email`,
   * `role`, `status` o `id` no se puedan tocar desde aquí ni aunque alguien
   * afloje el pipe más adelante.
   *
   * Distinguir `undefined` de `null` es parte del contrato: omitir la clave
   * significa "no la toques", mandar `null` significa "retira la preferencia".
   * Por eso no se usa `?? null`, que colapsaría los dos casos en uno.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const data: Prisma.UserUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
    };

    if (dto.hearingLossLevel !== undefined) {
      data.hearingLossLevel = dto.hearingLossLevel;
    }
    if (dto.communicationPreference !== undefined) {
      data.communicationPreference = dto.communicationPreference;
    }

    try {
      const updated = await this.prisma.user.update({ where: { id: userId }, data });
      return toPublicUser(updated);
    } catch (error) {
      // Solo P2025 ("registro a actualizar no encontrado") se traduce al 404 del
      // dominio. Cualquier otro fallo —conexión caída, constraint— se relanza
      // tal cual: convertirlo en 404 escondería una incidencia real detrás de
      // un mensaje tranquilizador.
      if (isRecordNotFound(error)) {
        throw profileNotFound();
      }
      throw error;
    }
  }
}

/**
 * ¿Es el error de Prisma "el registro a actualizar no existe"?
 *
 * Se comprueba por el código P2025 en vez de con `instanceof
 * PrismaClientKnownRequestError`: importar la clase del runtime de Prisma solo
 * para un `instanceof` acopla el service al cliente generado, y en los tests
 * obligaría a construir errores reales de Prisma para cubrir esta rama.
 */
function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2025'
  );
}
