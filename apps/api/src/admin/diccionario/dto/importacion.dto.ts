import type { ConfirmarImportacionInput } from '@academia/types';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ConfirmarImportacionDto implements ConfirmarImportacionInput {
  @IsUUID('4', { message: 'La vista previa no es válida. Vuelve a subir el archivo.' })
  token: string;

  @IsOptional()
  @IsBoolean()
  incluirDuplicadas?: boolean;
}
