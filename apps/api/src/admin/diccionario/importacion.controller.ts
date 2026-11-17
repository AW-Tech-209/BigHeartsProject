import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  type ConfirmarImportacionResponse,
  IMPORTACION_MAX_BYTES,
  UserRole,
  type VistaPreviaImportacionResponse,
} from '@academia/types';
import type { Response } from 'express';

import { Roles } from '../../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../../common/api-throttle';
import { csvInvalido } from '../../diccionario/carga-entradas.service';
import { ConfirmarImportacionDto } from './dto/importacion.dto';
import { ImportacionService, PLANTILLA_CSV } from './importacion.service';

interface ArchivoSubido {
  buffer: Buffer;
}

/** Importar entradas desde CSV: vista previa (no escribe) y confirmar. Solo ADMIN. */
@Controller('admin/diccionario/importacion')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class ImportacionController {
  constructor(private readonly importacion: ImportacionService) {}

  @Get('plantilla')
  plantilla(@Res() res: Response): void {
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', 'attachment; filename="plantilla-diccionario.csv"')
      .send(PLANTILLA_CSV);
  }

  @Post('vista-previa')
  @HttpCode(HttpStatus.OK)
  // Un byte de margen: el servicio responde FILE_TOO_LARGE con el límite en `details`.
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: IMPORTACION_MAX_BYTES + 1 } }))
  vistaPrevia(@UploadedFile() archivo?: ArchivoSubido): Promise<VistaPreviaImportacionResponse> {
    if (!archivo) throw csvInvalido('Elige un archivo CSV.');
    return this.importacion.vistaPrevia(archivo.buffer);
  }

  @Post('confirmar')
  @HttpCode(HttpStatus.OK)
  confirmar(@Body() dto: ConfirmarImportacionDto): Promise<ConfirmarImportacionResponse> {
    return this.importacion.confirmar(dto.token, dto.incluirDuplicadas ?? false);
  }
}
