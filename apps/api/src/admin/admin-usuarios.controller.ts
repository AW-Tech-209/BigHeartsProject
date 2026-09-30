import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type AdminUsuariosResponse, type CuentaCreadaResponse, UserRole } from '@academia/types';

import { Roles } from '../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../common/api-throttle';
import { AdminUsuariosService } from './admin-usuarios.service';
import { idDeUsuario } from './admin.errors';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ListAdminUsuariosDto } from './dto/list-admin-usuarios.dto';

/** Alta de cuentas por el admin (D49). `@Roles` en la clase: todo endpoint nuevo nace protegido. */
@Controller('admin/usuarios')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class AdminUsuariosController {
  constructor(private readonly service: AdminUsuariosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@Query() query: ListAdminUsuariosDto): Promise<AdminUsuariosResponse> {
    return this.service.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CrearUsuarioDto): Promise<CuentaCreadaResponse> {
    return this.service.create(dto);
  }

  @Post(':id/contrasena-temporal')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Param('id', idDeUsuario) id: string): Promise<CuentaCreadaResponse> {
    return this.service.resetTemporaryPassword(id);
  }
}
