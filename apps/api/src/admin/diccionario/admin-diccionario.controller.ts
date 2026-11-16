import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type AvanceDiccionarioResponse,
  type DuplicadosResponse,
  type EntradaAdmin,
  type EntradasAdminResponse,
  type LoteEntradasResponse,
  UserRole,
} from '@academia/types';

import { Roles } from '../../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../../common/api-throttle';
import { idDeEntrada } from '../../diccionario/diccionario.errors';
import { AdminDiccionarioService } from './admin-diccionario.service';
import { DuplicadosQueryDto } from './dto/duplicados-query.dto';
import { CrearEntradaDto, EditarEntradaDto } from './dto/entrada.dto';
import { EntradasAdminQueryDto } from './dto/entradas-admin-query.dto';
import { LoteEntradasDto } from './dto/lote-entradas.dto';

/** Gestión del diccionario: solo ADMIN. Rutas literales antes de `:id`. */
@Controller('admin/diccionario')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class AdminDiccionarioController {
  constructor(private readonly service: AdminDiccionarioService) {}

  @Get('avance')
  avance(): Promise<AvanceDiccionarioResponse> {
    return this.service.avance();
  }

  @Get('entradas')
  listar(@Query() query: EntradasAdminQueryDto): Promise<EntradasAdminResponse> {
    return this.service.listar(query);
  }

  @Get('entradas/duplicados')
  duplicados(@Query() query: DuplicadosQueryDto): Promise<DuplicadosResponse> {
    return this.service.duplicados(query);
  }

  @Post('entradas/lote')
  @HttpCode(HttpStatus.OK)
  lote(@Body() dto: LoteEntradasDto): Promise<LoteEntradasResponse> {
    return this.service.lote(dto);
  }

  @Get('entradas/:id')
  obtener(@Param('id', idDeEntrada) id: string): Promise<EntradaAdmin> {
    return this.service.obtener(id);
  }

  @Post('entradas')
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() dto: CrearEntradaDto): Promise<EntradaAdmin> {
    return this.service.crear(dto);
  }

  @Patch('entradas/:id')
  editar(
    @Param('id', idDeEntrada) id: string,
    @Body() dto: EditarEntradaDto,
  ): Promise<EntradaAdmin> {
    return this.service.editar(id, dto);
  }
}
