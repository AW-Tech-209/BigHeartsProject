import {
  BookingStatus,
  CLASSROOMS_PAGE_SIZE_MAX,
  type HistorialQuery,
  type ResultadoHistorial,
} from '@academia/types';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO de `GET /historial` (HU-404). Sin `studentId` ni `teacherId`: el
 * alcance sale del token (`ARQUITECTURA.md` §4.8, regla 3).
 */
export class ListHistorialDto implements HistorialQuery {
  @IsOptional()
  @IsIn([BookingStatus.ATTENDED, BookingStatus.NO_SHOW, BookingStatus.CANCELLED], {
    message: 'Elige un resultado: asististe, no asististe o cancelaste.',
  })
  resultado?: ResultadoHistorial;

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
