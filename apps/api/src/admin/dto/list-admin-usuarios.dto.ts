import {
  type AdminUsuariosQuery,
  CLASSROOMS_PAGE_SIZE_MAX,
  UserRole,
  UserStatus,
} from '@academia/types';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListAdminUsuariosDto implements AdminUsuariosQuery {
  @IsOptional()
  @IsEnum(UserRole, { message: 'Elige un rol válido.' })
  rol?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Elige un estado válido.' })
  estado?: UserStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100, { message: 'La búsqueda es demasiado larga.' })
  q?: string;

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
