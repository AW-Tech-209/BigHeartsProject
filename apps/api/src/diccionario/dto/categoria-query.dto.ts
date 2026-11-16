import { type CategoriaQuery, TipoEntrada } from '@academia/types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, Matches } from 'class-validator';

import { CODIGO_UNIDAD, MENSAJE_UNIDAD, aCodigoUnidad } from './modulo-query.dto';

export class CategoriaQueryDto implements CategoriaQuery {
  @IsOptional()
  @IsEnum(TipoEntrada, { message: 'Elige un tipo: palabra, verbo, frase o expresión.' })
  tipo?: TipoEntrada;

  @IsOptional()
  @Transform(aCodigoUnidad)
  @Matches(CODIGO_UNIDAD, { message: MENSAJE_UNIDAD })
  unidad?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: '«Solo con seña» debe ser true o false.' })
  conSena?: boolean;
}
