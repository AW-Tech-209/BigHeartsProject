import { CLASSROOMS_PAGE_SIZE_MAX, EstadoTemporalAula, type MisAulasQuery } from '@academia/types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO de `GET /classrooms/mias`. Implementa `MisAulasQuery` de
 * @academia/types, igual que `ListClassroomsDto` implementa
 * `ListClassroomsQuery`.
 *
 * **Lo que NO declara es la mitad importante:** no hay `teacherId`. El alcance
 * sale del token (`ARQUITECTURA.md` §4.8, regla 3), y el `whitelist` del
 * `ValidationPipe` global rechaza con `VALIDATION_ERROR` cualquier intento de
 * colarlo por el query string. Añadir aquí un campo que nombre a un profesor
 * es autorizar a leer las aulas de otro: no se hace.
 *
 * `page`/`pageSize` llegan como texto en el query string y necesitan
 * `@Type(() => Number)` para convertirse antes de que `class-validator` los
 * evalúe. Mismos límites que el catálogo: un solo contrato de paginación (A5).
 */
export class ListMisAulasDto implements MisAulasQuery {
  @IsOptional()
  @IsEnum(EstadoTemporalAula, {
    message: 'Elige un estado: próximas, pasadas, canceladas o todas.',
  })
  estado?: EstadoTemporalAula;

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
