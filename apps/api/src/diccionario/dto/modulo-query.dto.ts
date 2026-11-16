import type { ModuloQuery } from '@academia/types';
import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';

export const aCodigoUnidad = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export const CODIGO_UNIDAD = /^U\d{1,2}$/;
export const MENSAJE_UNIDAD = 'La unidad debe tener la forma U1, U2…';

export class ModuloQueryDto implements ModuloQuery {
  @IsOptional()
  @Transform(aCodigoUnidad)
  @Matches(CODIGO_UNIDAD, { message: MENSAJE_UNIDAD })
  unidad?: string;
}
