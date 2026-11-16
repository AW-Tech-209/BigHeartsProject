import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type ConfirmarVideoResponse,
  type SinSenaResponse,
  type SubidaImagenResponse,
  type SubidaVideoResponse,
  UserRole,
} from '@academia/types';
import type { Response } from 'express';

import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../../common/api-throttle';
import { idDeEntrada, idDeVideo } from '../../diccionario/diccionario.errors';
import {
  ConfirmarImagenDto,
  SinSenaQueryDto,
  SubidaImagenDto,
  SubidaVideoDto,
} from './dto/medios.dto';
import { MediosService } from './medios.service';

/** Señas e imágenes del diccionario (D51): el archivo va directo al almacenamiento. */
@Controller('admin/diccionario')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class MediosController {
  constructor(private readonly medios: MediosService) {}

  @Get('sin-sena')
  sinSena(@Query() query: SinSenaQueryDto): Promise<SinSenaResponse> {
    return this.medios.sinSena(query.modulo);
  }

  @Get('sin-sena.csv')
  async sinSenaCsv(@Query() query: SinSenaQueryDto, @Res() res: Response): Promise<void> {
    const csv = await this.medios.sinSenaCsv(query.modulo);
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', 'attachment; filename="senas-pendientes.csv"')
      .send(csv);
  }

  @Post('entradas/:id/video/subida')
  @HttpCode(HttpStatus.CREATED)
  subirVideo(
    @Param('id', idDeEntrada) id: string,
    @Body() dto: SubidaVideoDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<SubidaVideoResponse> {
    return this.medios.iniciarSubidaVideo(id, dto, admin.id);
  }

  @Post('entradas/:id/video/:videoId/confirmar')
  @HttpCode(HttpStatus.OK)
  confirmarVideo(
    @Param('id', idDeEntrada) id: string,
    @Param('videoId', idDeVideo) videoId: string,
  ): Promise<ConfirmarVideoResponse> {
    return this.medios.confirmarVideo(id, videoId);
  }

  @Delete('entradas/:id/video')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarVideo(@Param('id', idDeEntrada) id: string): Promise<void> {
    return this.medios.quitarVideo(id);
  }

  @Post('entradas/:id/imagen/subida')
  @HttpCode(HttpStatus.CREATED)
  subirImagen(
    @Param('id', idDeEntrada) id: string,
    @Body() dto: SubidaImagenDto,
  ): Promise<SubidaImagenResponse> {
    return this.medios.iniciarSubidaImagen(id, dto);
  }

  @Post('entradas/:id/imagen/confirmar')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmarImagen(
    @Param('id', idDeEntrada) id: string,
    @Body() dto: ConfirmarImagenDto,
  ): Promise<void> {
    return this.medios.confirmarImagen(id, dto.clave);
  }

  @Delete('entradas/:id/imagen')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarImagen(@Param('id', idDeEntrada) id: string): Promise<void> {
    return this.medios.quitarImagen(id);
  }
}
