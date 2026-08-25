import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  type PendingTeachersResponse,
  type TeacherApprovalResponse,
  type TeachersResponse,
  UserRole,
} from '@academia/types';

import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { teacherNotFound } from './admin.errors';

/**
 * Valida que el `:id` de la ruta tenga forma de UUID **antes** de que llegue a
 * Prisma, y trata el fallo como «no existe».
 *
 * Sin esto, `/admin/teachers/hola/approve` llega a un `findUnique` sobre una
 * columna `@db.Uuid`, Postgres rechaza el literal y la respuesta es un 500 —lo
 * que el AC5 de la HU-104 prohíbe explícitamente—. Y el error correcto es
 * `USER_NOT_FOUND` y no `VALIDATION_ERROR`: desde fuera, un id con forma
 * inválida y un id que no existe son el mismo hecho, «ahí no hay nadie».
 *
 * Se instancia una sola vez, arriba del todo, por dos razones: un `new` dentro
 * de `@Param()` construiría un pipe por petición, y los decoradores se evalúan
 * al definir la clase, así que declararlo debajo no compila.
 *
 * Se exporta solo para que `admin.controller.spec.ts` pueda comprobar esa
 * traducción: es una garantía del AC5, no un detalle interno.
 */
export const idDeProfesor = new ParseUUIDPipe({ exceptionFactory: () => teacherNotFound() });

/**
 * Back-office: aprobación de profesores (HU-104).
 *
 * `@Roles` va en la CLASE y no en cada método a propósito: así el endpoint que
 * alguien añada aquí mañana nace protegido. Poner el decorador método a método
 * hace que la ruta desprotegida sea la que se olvidó, y esa es exactamente la
 * que nadie revisa. El `RolesGuard` global lee el metadato del handler y, si no
 * hay, el de la clase.
 *
 * Quien decide el permiso es esto, no la pantalla: `<RequireAuth roles={…}>` en
 * el frontend solo evita ofrecer una página que acabaría en 403.
 */
@Controller('admin/teachers')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/teachers
   *
   * Todos los profesores, sin filtrar por estado. Alimenta el selector del
   * filtro de supervisión de aulas (HU-210), no un listado de gestión propio.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listAll(): Promise<TeachersResponse> {
    const teachers = await this.adminService.listTeachers();
    return { teachers };
  }

  /**
   * GET /admin/teachers/pending
   *
   * Los profesores con `status = PENDING`, del más antiguo al más reciente.
   */
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async listPending(): Promise<PendingTeachersResponse> {
    const teachers = await this.adminService.listPendingTeachers();
    return { teachers };
  }

  /**
   * POST /admin/teachers/:id/approve
   *
   * `PENDING → ACTIVE`. El profesor que antes recibía `ACCOUNT_PENDING` al
   * intentar entrar, a partir de aquí inicia sesión con normalidad.
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id', idDeProfesor) teacherId: string): Promise<TeacherApprovalResponse> {
    const user = await this.adminService.approveTeacher(teacherId);
    return { user };
  }

  /**
   * POST /admin/teachers/:id/reject
   *
   * `PENDING → REJECTED`. La cuenta se conserva; su login pasa a responder
   * `ACCOUNT_REJECTED`.
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id', idDeProfesor) teacherId: string): Promise<TeacherApprovalResponse> {
    const user = await this.adminService.rejectTeacher(teacherId);
    return { user };
  }
}
