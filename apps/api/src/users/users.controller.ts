import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import type { ProfileResponse } from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

/**
 * Perfil propio (HU-103).
 *
 * Las dos rutas son `/me` a propósito y NO existe `GET|PATCH /users/:id`: el id
 * del usuario sale siempre del access token vía `@CurrentUser()`, nunca de la
 * ruta ni del cuerpo. Es lo que hace estructuralmente imposible leer o editar
 * el perfil de otra persona — no hay nada que "autorizar" porque no hay forma
 * de nombrar a un tercero. La edición de perfiles ajenos pertenece a
 * `AdminModule` y llega con su propia HU.
 *
 * Ninguna lleva `@Public()`: el JwtAuthGuard global exige access token válido y
 * responde `UNAUTHENTICATED` si falta.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   *
   * Devuelve el perfil del usuario del token. Va a la BD en vez de devolver los
   * claims del JWT: el token es una foto de hasta 15 minutos atrás y no lleva
   * ni el nombre ni las preferencias de accesibilidad.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() current: AuthenticatedUser): Promise<ProfileResponse> {
    const user = await this.usersService.getProfile(current.id);
    return { user };
  }

  /**
   * PATCH /users/me
   *
   * Actualiza los campos editables del perfil propio. `email` y `role` no son
   * campos del DTO, así que el ValidationPipe global los rechaza antes de
   * llegar aquí (ver `UpdateProfileDto`).
   */
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const user = await this.usersService.updateProfile(current.id, current.role, dto);
    return { user };
  }
}
