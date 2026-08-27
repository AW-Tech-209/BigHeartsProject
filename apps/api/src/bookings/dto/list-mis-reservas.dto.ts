import {
  CLASSROOMS_PAGE_SIZE_MAX,
  EstadoTemporalAula,
  type MisReservasQuery,
} from '@academia/types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO de `GET /bookings/mias` (HU-302). Implementa `MisReservasQuery`, sin
 * `studentId`: el alcance sale del token (§4.8, regla 3), igual que
 * `ListMisAulasDto`.
 */
export class ListMisReservasDto implements MisReservasQuery {
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
