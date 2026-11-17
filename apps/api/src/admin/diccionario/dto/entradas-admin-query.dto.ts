import {
  ENTRADAS_ADMIN_PAGE_SIZE_MAX,
  ESTADOS_SENA_ADMIN,
  type EntradasAdminQuery,
  type EstadoSenaAdmin,
  TipoEntrada,
} from '@academia/types';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  aCodigoUnidad,
  CODIGO_UNIDAD,
  MENSAJE_UNIDAD,
} from '../../../diccionario/dto/modulo-query.dto';

export const aBooleano = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class EntradasAdminQueryDto implements EntradasAdminQuery {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100, { message: 'La búsqueda es demasiado larga.' })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El módulo debe ser un número.' })
  @Min(1)
  @Max(99)
  modulo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @IsOptional()
  @IsEnum(TipoEntrada, { message: 'Elige un tipo: palabra, verbo, frase o expresión.' })
  tipo?: TipoEntrada;

  @IsOptional()
  @Transform(aCodigoUnidad)
  @Matches(CODIGO_UNIDAD, { message: MENSAJE_UNIDAD })
  unidad?: string;

  @IsOptional()
  @IsIn(ESTADOS_SENA_ADMIN, { message: 'Elige un estado de seña válido.' })
  sena?: EstadoSenaAdmin;

  @IsOptional()
  @IsIn(['con', 'sin'], { message: 'El filtro de imagen es «con» o «sin».' })
  imagen?: 'con' | 'sin';

  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean({ message: '«Publicada» debe ser true o false.' })
  publicada?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser al menos 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser al menos 1.' })
  @Max(ENTRADAS_ADMIN_PAGE_SIZE_MAX, {
    message: `El tamaño de página no puede superar ${ENTRADAS_ADMIN_PAGE_SIZE_MAX}.`,
  })
  pageSize?: number;
}
