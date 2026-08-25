import {
  type AdminClassroomsQuery,
  CLASSROOMS_PAGE_SIZE_MAX,
  ClassroomStatus,
} from '@academia/types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * DTO de `GET /admin/classrooms` (HU-210). Implementa `AdminClassroomsQuery`
 * de @academia/types. Todo opcional y combinable (T4): sin ningún filtro,
 * devuelve el listado completo.
 *
 * `page`/`pageSize` llegan como texto en el query string y necesitan
 * `@Type(() => Number)` para convertirse antes de que `class-validator` los
 * evalúe. Mismos límites que el catálogo y «Mis aulas» (T6).
 */
export class ListAdminClassroomsDto implements AdminClassroomsQuery {
  @IsOptional()
  @IsUUID(undefined, { message: 'El id del profesor no tiene forma de UUID.' })
  teacherId?: string;

  @IsOptional()
  @IsEnum(ClassroomStatus, { message: 'Elige un estado válido de aula.' })
  status?: ClassroomStatus;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de inicio del rango no es válida.' })
  desde?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de fin del rango no es válida.' })
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser al menos 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser al menos 1.' })
  @Max(CLASSROOMS_PAGE_SIZE_MAX, {
    message: `El tamaño de página no puede superar ${CLASSROOMS_PAGE_SIZE_MAX}.`,
  })
  pageSize?: number;
}
