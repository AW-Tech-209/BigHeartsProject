import {
  BUSQUEDA_LIMITE_MAX,
  BUSQUEDA_MIN_CARACTERES,
  type BusquedaQuery,
  normalizarTexto,
} from '@academia/types';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class BuscarQueryDto implements BusquedaQuery {
  @Transform(({ value }) => (typeof value === 'string' ? normalizarTexto(value) : value))
  @IsString({ message: 'Escribe qué quieres buscar.' })
  @MinLength(BUSQUEDA_MIN_CARACTERES, {
    message: `Escribe al menos ${BUSQUEDA_MIN_CARACTERES} letras para buscar.`,
  })
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser al menos 1.' })
  @Max(BUSQUEDA_LIMITE_MAX, { message: `El límite no puede superar ${BUSQUEDA_LIMITE_MAX}.` })
  limite?: number;
}
