import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type BusquedaResponse,
  type CategoriaDetalleResponse,
  type DiccionarioInicioResponse,
  type EntradaDetalleResponse,
  type ModuloDetalleResponse,
  UserRole,
} from '@academia/types';

import { Roles } from '../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../common/api-throttle';
import { moduloNotFound } from './diccionario.errors';
import { DiccionarioService } from './diccionario.service';
import { BuscarQueryDto } from './dto/buscar-query.dto';
import { CategoriaQueryDto } from './dto/categoria-query.dto';
import { ModuloQueryDto } from './dto/modulo-query.dto';

const numeroDeModulo = new ParseIntPipe({ exceptionFactory: () => moduloNotFound() });

/** Lectura del diccionario: cualquier rol con sesión (D50). */
@Controller('diccionario')
@Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class DiccionarioController {
  constructor(private readonly diccionario: DiccionarioService) {}

  @Get()
  inicio(): Promise<DiccionarioInicioResponse> {
    return this.diccionario.inicio();
  }

  @Get('buscar')
  buscar(@Query() query: BuscarQueryDto): Promise<BusquedaResponse> {
    return this.diccionario.buscar(query);
  }

  @Get('modulos/:numero')
  modulo(
    @Param('numero', numeroDeModulo) numero: number,
    @Query() query: ModuloQueryDto,
  ): Promise<ModuloDetalleResponse> {
    return this.diccionario.modulo(numero, query);
  }

  @Get('modulos/:numero/categorias/:slug')
  categoria(
    @Param('numero', numeroDeModulo) numero: number,
    @Param('slug') slug: string,
    @Query() query: CategoriaQueryDto,
  ): Promise<CategoriaDetalleResponse> {
    return this.diccionario.categoria(numero, slug, query);
  }

  @Get('entradas/:slug')
  entrada(@Param('slug') slug: string): Promise<EntradaDetalleResponse> {
    return this.diccionario.entrada(slug);
  }
}
