import { type DuplicadosQuery, TipoEntrada } from '@academia/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DuplicadosQueryDto implements DuplicadosQuery {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Escribe la palabra en inglés.' })
  @MaxLength(200)
  ingles: string;

  @IsOptional()
  @IsEnum(TipoEntrada)
  tipo?: TipoEntrada;

  @IsOptional()
  @IsUUID('4')
  excluir?: string;
}
