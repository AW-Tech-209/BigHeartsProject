import { type CrearEntradaInput, type EditarEntradaInput, TipoEntrada } from '@academia/types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
/** Cadena vacía = quitar el campo. */
const trimONull = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const TIPO = { message: 'Elige un tipo: palabra, verbo, frase o expresión.' };

export class CrearEntradaDto implements CrearEntradaInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Escribe la palabra en inglés.' })
  @MaxLength(200, { message: 'El inglés es demasiado largo.' })
  ingles: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Escribe la traducción al español.' })
  @MaxLength(200, { message: 'El español es demasiado largo.' })
  espanol: string;

  @IsEnum(TipoEntrada, TIPO)
  tipo: TipoEntrada;

  @IsUUID('4', { message: 'Elige un módulo.' })
  moduloId: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID('4', { message: 'Elige una unidad válida.' })
  unidadId?: string | null;

  @IsUUID('4', { message: 'Elige una categoría.' })
  categoriaId: string;

  @IsOptional()
  @Transform(trimONull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500, { message: 'La nota es demasiado larga.' })
  nota?: string | null;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}

export class EditarEntradaDto implements EditarEntradaInput {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Escribe la palabra en inglés.' })
  @MaxLength(200, { message: 'El inglés es demasiado largo.' })
  ingles?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Escribe la traducción al español.' })
  @MaxLength(200, { message: 'El español es demasiado largo.' })
  espanol?: string;

  @IsOptional()
  @IsEnum(TipoEntrada, TIPO)
  tipo?: TipoEntrada;

  @IsOptional()
  @IsUUID('4', { message: 'Elige un módulo.' })
  moduloId?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID('4', { message: 'Elige una unidad válida.' })
  unidadId?: string | null;

  @IsOptional()
  @IsUUID('4', { message: 'Elige una categoría.' })
  categoriaId?: string;

  @IsOptional()
  @Transform(trimONull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500, { message: 'La nota es demasiado larga.' })
  nota?: string | null;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}
