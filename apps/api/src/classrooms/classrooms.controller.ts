import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { type CreateClassroomResponse, UserRole } from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';

/**
 * Aulas virtuales.
 *
 * A diferencia de `AdminController`, `@Roles` va en cada MÉTODO y no en la
 * clase: aquí no todos los endpoints tienen el mismo público. Crear es de
 * profesores, pero el listado y el detalle (HU-203 y HU-204) los ve cualquier
 * usuario autenticado. Un `@Roles(TEACHER)` de clase los cerraría a los
 * estudiantes, que son justo para quienes existe el catálogo.
 */
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  /**
   * POST /classrooms — publica un aula nueva.
   *
   * El aula nace `PUBLISHED` (D15): no hay paso de publicación en Fase 1. El
   * dueño sale del token, y el estado `ACTIVE` del profesor lo comprueba el
   * servicio contra la base de datos.
   */
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() teacher: AuthenticatedUser,
    @Body() dto: CreateClassroomDto,
  ): Promise<CreateClassroomResponse> {
    const classroom = await this.classroomsService.createClassroom(teacher, dto);
    return { classroom };
  }
}
