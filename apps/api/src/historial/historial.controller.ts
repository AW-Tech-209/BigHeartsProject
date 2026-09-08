import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type HistorialEstudianteResponse,
  type HistorialProfesorResponse,
  UserRole,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../common/api-throttle';
import { ListHistorialDto } from './dto/list-historial.dto';
import { HistorialService } from './historial.service';

/**
 * `GET /historial` (HU-404, D34). Solo `STUDENT` y `TEACHER`: el `ADMIN`
 * queda fuera a propósito (su supervisión ya le da todas las aulas), y el
 * `RolesGuard` lo responde con `403` sin que este controlador tenga que
 * comprobarlo.
 */
@Controller('historial')
@Roles(UserRole.STUDENT, UserRole.TEACHER)
@Throttle(API_THROTTLE)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  async list(
    @CurrentUser() viewer: AuthenticatedUser,
    @Query() query: ListHistorialDto,
  ): Promise<HistorialEstudianteResponse | HistorialProfesorResponse> {
    return this.historialService.listHistorial(viewer, query);
  }
}
