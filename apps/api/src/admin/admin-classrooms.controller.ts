import { Controller, Get, Query } from '@nestjs/common';
import { type AdminClassroomsResponse, UserRole } from '@academia/types';

import { Roles } from '../auth/decorators/roles.decorator';
import { AdminClassroomsService } from './admin-classrooms.service';
import { ListAdminClassroomsDto } from './dto/list-admin-classrooms.dto';

/**
 * Supervisión de aulas para el administrador (HU-210, D20 de
 * `ARQUITECTURA.md` §4.8).
 *
 * Endpoint propio, no un `?todas=true` sobre `GET /classrooms`: aquel es
 * público, y convertirlo en un endpoint con dos comportamientos según el rol
 * es la clase de bifurcación por la que se cuelan los fallos de autorización
 * (decisión 1 de la HU).
 */
@Controller('admin/classrooms')
@Roles(UserRole.ADMIN)
export class AdminClassroomsController {
  constructor(private readonly adminClassroomsService: AdminClassroomsService) {}

  @Get()
  async list(@Query() query: ListAdminClassroomsDto): Promise<AdminClassroomsResponse> {
    return this.adminClassroomsService.listAll(query);
  }
}
