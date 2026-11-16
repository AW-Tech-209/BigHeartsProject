import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  Put,
  Query,
  Req,
  Res,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';
import type { Request, Response } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { AlmacenamientoMedios } from './almacenamiento-medios';
import { ArchivoDemasiadoGrande, LocalAlmacenamientoService } from './local-almacenamiento.service';

/**
 * Subida y lectura del adaptador local (desarrollo y tests). Públicas porque el permiso
 * viaja en el token firmado, como en una URL firmada de Supabase.
 */
@Controller('almacenamiento-local')
@Public()
export class AlmacenamientoLocalController {
  constructor(private readonly almacenamiento: AlmacenamientoMedios) {}

  @Put('subir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subir(@Query('t') token: string, @Req() req: Request): Promise<void> {
    const local = this.local();
    const permiso = local.verificar(token ?? '', 'subir');
    if (!permiso) throw new ForbiddenException('El permiso de subida no es válido o caducó.');
    if (req.headers['content-type'] !== permiso.tipo) {
      throw new UnsupportedMediaTypeException({
        code: ApiErrorCode.FILE_TYPE_NOT_ALLOWED,
        message: 'El tipo del archivo no coincide con el que se pidió subir.',
      });
    }
    try {
      await local.guardar(permiso, req);
    } catch (error) {
      if (error instanceof ArchivoDemasiadoGrande) {
        throw new PayloadTooLargeException({
          code: ApiErrorCode.FILE_TOO_LARGE,
          message: 'El archivo es más grande de lo permitido.',
          details: { maxBytes: permiso.max },
        });
      }
      throw error;
    }
  }

  @Get('leer')
  leer(@Query('t') token: string, @Res() res: Response): void {
    const local = this.local();
    const permiso = local.verificar(token ?? '', 'leer');
    if (!permiso) throw new ForbiddenException('El enlace no es válido o caducó.');
    // El front (otro puerto en desarrollo) reproduce el video con <video src>.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(local.ruta(permiso.clave), (error) => {
      if (error && !res.headersSent) res.status(HttpStatus.NOT_FOUND).end();
    });
  }

  private local(): LocalAlmacenamientoService {
    if (!(this.almacenamiento instanceof LocalAlmacenamientoService)) throw new NotFoundException();
    return this.almacenamiento;
  }
}
