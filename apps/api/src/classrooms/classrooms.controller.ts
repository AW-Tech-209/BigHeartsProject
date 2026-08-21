import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  type CreateClassroomResponse,
  type ListClassroomsResponse,
  type MisAulasResponse,
  UserRole,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { ListClassroomsDto } from './dto/list-classrooms.dto';
import { ListMisAulasDto } from './dto/list-mis-aulas.dto';

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

  /**
   * GET /classrooms — catálogo de aulas disponibles (HU-203).
   *
   * Sin `@Roles`: la ve cualquier usuario con sesión válida, estudiante,
   * profesor o administrador — es justo el catálogo del que un estudiante
   * elige su clase.
   */
  @Get()
  async list(@Query() query: ListClassroomsDto): Promise<ListClassroomsResponse> {
    return this.classroomsService.listClassrooms(query);
  }

  /**
   * GET /classrooms/mias — el registro del profesor (HU-207).
   *
   * Devuelve **todas** sus aulas: publicadas, canceladas y ya pasadas. No es el
   * catálogo con otro filtro, es otra vista (§4.8): el catálogo existe para
   * descubrir una clase, esta para gestionar las propias.
   *
   * El `teacherId` sale de `@CurrentUser()`. **No hay ni habrá
   * `?teacherId=`**: un endpoint que cambia de alcance según un parámetro es
   * por donde se cuelan los fallos de autorización (§4.8, regla 3).
   *
   * ⚠️ **Esta ruta tiene que declararse ANTES que cualquier `@Get(':id')`.**
   * Nest resuelve por orden de registro, así que un `:id` por encima se tragaría
   * `mias` como si fuera un identificador. HU-204 añade ese detalle: va debajo.
   */
  @Get('mias')
  @Roles(UserRole.TEACHER)
  async listMias(
    @CurrentUser() teacher: AuthenticatedUser,
    @Query() query: ListMisAulasDto,
  ): Promise<MisAulasResponse> {
    return this.classroomsService.listMisAulas(teacher, query);
  }
}
