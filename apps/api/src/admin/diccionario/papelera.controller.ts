import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type PapeleraResponse, type PurgaResponse, UserRole } from '@academia/types';

import { Roles } from '../../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../../common/api-throttle';
import { idDeEntrada } from '../../diccionario/diccionario.errors';
import { RestaurarEntradaDto } from './dto/estructura.dto';
import { PapeleraService } from './papelera.service';

/** Papelera del diccionario (D52): solo ADMIN. */
@Controller('admin/diccionario')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class PapeleraController {
  constructor(private readonly papelera: PapeleraService) {}

  @Delete('entradas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  enviar(@Param('id', idDeEntrada) id: string): Promise<void> {
    return this.papelera.enviar(id);
  }

  @Get('papelera')
  listar(): Promise<PapeleraResponse> {
    return this.papelera.listar();
  }

  @Post('papelera/:id/restaurar')
  @HttpCode(HttpStatus.NO_CONTENT)
  restaurar(@Param('id', idDeEntrada) id: string, @Body() dto: RestaurarEntradaDto): Promise<void> {
    return this.papelera.restaurar(id, dto);
  }

  @Delete('papelera')
  vaciar(): Promise<PurgaResponse> {
    return this.papelera.vaciar();
  }

  @Delete('papelera/:id')
  eliminarParaSiempre(@Param('id', idDeEntrada) id: string): Promise<PurgaResponse> {
    return this.papelera.eliminarParaSiempre(id);
  }
}
