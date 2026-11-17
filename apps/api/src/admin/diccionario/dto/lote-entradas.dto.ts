import { AccionLote, LOTE_MAX_IDS, type LoteEntradasInput } from '@academia/types';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class LoteEntradasDto implements LoteEntradasInput {
  @IsArray()
  @ArrayMinSize(1, { message: 'Elige al menos una entrada.' })
  @ArrayMaxSize(LOTE_MAX_IDS, {
    message: `Puedes cambiar hasta ${LOTE_MAX_IDS} entradas a la vez.`,
  })
  @ArrayUnique()
  @IsUUID('4', { each: true, message: 'Hay una entrada que no existe.' })
  ids: string[];

  @IsEnum(AccionLote, { message: 'Elige qué hacer con las entradas.' })
  accion: AccionLote;

  @ValidateIf((o: LoteEntradasDto) => o.accion === AccionLote.MOVER_CATEGORIA)
  @IsUUID('4', { message: 'Elige la categoría de destino.' })
  categoriaId?: string;

  @ValidateIf((o: LoteEntradasDto) => o.accion === AccionLote.MOVER_MODULO)
  @IsUUID('4', { message: 'Elige el módulo de destino.' })
  moduloId?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID('4', { message: 'Elige una unidad válida.' })
  unidadId?: string | null;
}
