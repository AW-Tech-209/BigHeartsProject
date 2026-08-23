import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  type ClassroomDetailResponse,
  type CreateClassroomResponse,
  type ListClassroomsResponse,
  type MisAulasResponse,
  type UpdateClassroomAccessibilityResponse,
  UserRole,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClassroomsService } from './classrooms.service';
import { classroomNotFound } from './classrooms.errors';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { ListClassroomsDto } from './dto/list-classrooms.dto';
import { ListMisAulasDto } from './dto/list-mis-aulas.dto';
import { UpdateClassroomAccessibilityDto } from './dto/update-classroom-accessibility.dto';

/**
 * Valida que el `:id` de la ruta tenga forma de UUID **antes** de que llegue a
 * Prisma, y trata el fallo como «no existe».
 *
 * Sin esto, `/classrooms/hola` llega a un `findUnique` sobre una columna
 * `@db.Uuid`, Postgres rechaza el literal y la respuesta es un 500. Mismo patrón
 * y mismo motivo que `idDeProfesor` en `AdminController`: desde fuera, un id
 * malformado y uno inexistente son el mismo hecho.
 *
 * Se instancia una sola vez, arriba del todo: un `new` dentro de `@Param()`
 * construiría un pipe por petición, y los decoradores se evalúan al definir la
 * clase, así que declararlo debajo no compila.
 *
 * Se exporta para que el spec pueda comprobar esa traducción: es una garantía
 * del AC3, no un detalle interno.
 */
export const idDeAula = new ParseUUIDPipe({ exceptionFactory: () => classroomNotFound() });

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
   *
   * El `@CurrentUser()` es para `?mias=true` (HU-208) y para nada más. **No
   * convierte esto en un endpoint con dos comportamientos**: sigue devolviendo
   * el mismo catálogo a los tres roles, y `mias` es un filtro que el cliente
   * pide explícitamente, nunca un alcance implícito por rol. El id del profesor
   * sale de aquí precisamente para que no pueda venir del query (§4.8, regla 3).
   */
  @Get()
  async list(
    @CurrentUser() viewer: AuthenticatedUser,
    @Query() query: ListClassroomsDto,
  ): Promise<ListClassroomsResponse> {
    return this.classroomsService.listClassrooms(viewer, query);
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
   * ⚠️ **Esta ruta tiene que declararse ANTES que `@Get(':id')`.** Nest resuelve
   * por orden de registro, así que un `:id` por encima se tragaría `mias` como
   * si fuera un identificador. El detalle de HU-204 va justo debajo, y
   * `classrooms.controller.spec.ts` vigila que ese orden no se invierta.
   */
  @Get('mias')
  @Roles(UserRole.TEACHER)
  async listMias(
    @CurrentUser() teacher: AuthenticatedUser,
    @Query() query: ListMisAulasDto,
  ): Promise<MisAulasResponse> {
    return this.classroomsService.listMisAulas(teacher, query);
  }

  /**
   * GET /classrooms/:id — el detalle completo de un aula (HU-204).
   *
   * **Va la última a propósito**: es la ruta más genérica del controlador y
   * cualquier `@Get('<literal>')` que se añada mañana tiene que quedar por
   * encima de ella, o dejará de existir.
   *
   * Sin `@Roles`: la ve cualquier usuario con sesión válida. Lo que cambia según
   * quién pregunta no es el acceso a la pantalla sino **un campo** —el
   * `meetingLink`—, y esa decisión la toma el servicio, no un decorador.
   */
  @Get(':id')
  async detail(
    @CurrentUser() viewer: AuthenticatedUser,
    @Param('id', idDeAula) classroomId: string,
  ): Promise<ClassroomDetailResponse> {
    const classroom = await this.classroomsService.getClassroomDetail(viewer, classroomId);
    return { classroom };
  }

  /**
   * PATCH /classrooms/:id — completa o corrige los 5 campos de accesibilidad
   * de un aula ya creada (HU-211).
   *
   * **No es la edición general del aula.** Ese endpoint —título, horario,
   * cupo, enlace— lo trae HU-202, todavía pendiente, y extenderá este mismo
   * método y esta misma ruta con el resto de campos editables (decisión D25 de
   * `ARQUITECTURA.md`), no lo reemplazará.
   *
   * Solo el profesor dueño puede completarla: cualquier otro recibe
   * `CLASSROOM_FORBIDDEN` (403), decidido en el servicio.
   */
  @Patch(':id')
  @Roles(UserRole.TEACHER)
  async updateAccessibility(
    @CurrentUser() teacher: AuthenticatedUser,
    @Param('id', idDeAula) classroomId: string,
    @Body() dto: UpdateClassroomAccessibilityDto,
  ): Promise<UpdateClassroomAccessibilityResponse> {
    const classroom = await this.classroomsService.updateClassroomAccessibility(
      teacher,
      classroomId,
      dto,
    );
    return { classroom };
  }
}
