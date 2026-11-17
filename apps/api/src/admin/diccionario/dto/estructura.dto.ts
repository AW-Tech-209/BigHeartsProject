import {
  type CrearCategoriaInput,
  type CrearUnidadInput,
  type EditarCategoriaInput,
  type EditarModuloInput,
  type EditarUnidadInput,
  type EliminarConEntradasInput,
  EstadoModulo,
  ICONOS_CATEGORIA,
  type IconoCategoria,
  type ReordenarInput,
  type RestaurarEntradaInput,
  TramoModulo,
} from '@academia/types';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const trimONull = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const ICONO = { message: 'Elige un ícono de la lista.' };

export class ReordenarDto implements ReordenarInput {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ids: string[];
}

export class EditarModuloDto implements EditarModuloInput {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El módulo necesita un nombre.' })
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsEnum(TramoModulo)
  tramo?: TramoModulo;

  @IsOptional()
  @IsEnum(EstadoModulo)
  estado?: EstadoModulo;
}

export class CrearUnidadDto implements CrearUnidadInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La unidad necesita un nombre.' })
  @MaxLength(120)
  nombre: string;
}

export class EditarUnidadDto extends CrearUnidadDto implements EditarUnidadInput {}

export class CrearCategoriaDto implements CrearCategoriaInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La categoría necesita un nombre.' })
  @MaxLength(60)
  nombre: string;

  @IsIn(ICONOS_CATEGORIA, ICONO)
  icono: IconoCategoria;

  @IsOptional()
  @Transform(trimONull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  descripcion?: string | null;
}

export class EditarCategoriaDto implements EditarCategoriaInput {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La categoría necesita un nombre.' })
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsIn(ICONOS_CATEGORIA, ICONO)
  icono?: IconoCategoria;

  @IsOptional()
  @Transform(trimONull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  descripcion?: string | null;
}

export class EliminarConEntradasDto implements EliminarConEntradasInput {
  @IsOptional()
  @IsIn(['mover', 'papelera'], { message: 'Elige: mover las entradas o enviarlas a la papelera.' })
  destino?: 'mover' | 'papelera';

  @ValidateIf((o: EliminarConEntradasDto) => o.destino === 'mover')
  @IsUUID('4', { message: 'Elige a dónde mover las entradas.' })
  haciaId?: string;
}

export class RestaurarEntradaDto implements RestaurarEntradaInput {
  @IsOptional()
  @IsUUID('4')
  categoriaId?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID('4')
  unidadId?: string | null;
}
