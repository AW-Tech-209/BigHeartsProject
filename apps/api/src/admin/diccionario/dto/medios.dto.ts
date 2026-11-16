import {
  type ConfirmarImagenInput,
  type SinSenaQuery,
  type SubidaImagenInput,
  type SubidaVideoInput,
  type TipoImagen,
} from '@academia/types';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Los tipos se comprueban en el servicio para responder FILE_TYPE_NOT_ALLOWED, no VALIDATION_ERROR.
export class SubidaVideoDto implements SubidaVideoInput {
  @IsString()
  tipo: 'video/mp4';

  @IsInt({ message: 'El tamaño debe ser un número entero de bytes.' })
  @Min(1)
  bytes: number;

  @IsInt({ message: 'La duración debe ser un número entero de milisegundos.' })
  @Min(1)
  duracionMs: number;

  @IsString()
  miniaturaTipo: 'image/jpeg';
}

export class SubidaImagenDto implements SubidaImagenInput {
  @IsString()
  tipo: TipoImagen;

  @IsInt({ message: 'El tamaño debe ser un número entero de bytes.' })
  @Min(1)
  bytes: number;
}

export class ConfirmarImagenDto implements ConfirmarImagenInput {
  @IsString()
  @MaxLength(200)
  clave: string;
}

export class SinSenaQueryDto implements SinSenaQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El módulo debe ser un número.' })
  @Min(1)
  @Max(99)
  modulo?: number;
}
