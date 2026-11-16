import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type CategoriaAdmin,
  type CategoriasAdminResponse,
  type ModulosAdminResponse,
  type UnidadAdmin,
  UserRole,
} from '@academia/types';

import { Roles } from '../../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../../common/api-throttle';
import { idDeCategoria, idDeModulo, idDeUnidad } from '../../diccionario/diccionario.errors';
import {
  CrearCategoriaDto,
  CrearUnidadDto,
  EditarCategoriaDto,
  EditarModuloDto,
  EditarUnidadDto,
  EliminarConEntradasDto,
  ReordenarDto,
} from './dto/estructura.dto';
import { EstructuraService } from './estructura.service';

/** Módulos, unidades y categorías del diccionario: solo ADMIN. Rutas `orden` antes de `:id`. */
@Controller('admin/diccionario')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class EstructuraController {
  constructor(private readonly estructura: EstructuraService) {}

  @Get('modulos')
  modulos(): Promise<ModulosAdminResponse> {
    return this.estructura.modulos();
  }

  @Patch('modulos/orden')
  @HttpCode(HttpStatus.NO_CONTENT)
  reordenarModulos(@Body() dto: ReordenarDto): Promise<void> {
    return this.estructura.reordenarModulos(dto.ids);
  }

  @Patch('modulos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  editarModulo(@Param('id', idDeModulo) id: string, @Body() dto: EditarModuloDto): Promise<void> {
    return this.estructura.editarModulo(id, dto);
  }

  @Post('modulos/:id/unidades')
  @HttpCode(HttpStatus.CREATED)
  crearUnidad(
    @Param('id', idDeModulo) id: string,
    @Body() dto: CrearUnidadDto,
  ): Promise<UnidadAdmin> {
    return this.estructura.crearUnidad(id, dto.nombre);
  }

  @Patch('modulos/:id/unidades/orden')
  @HttpCode(HttpStatus.NO_CONTENT)
  reordenarUnidades(@Param('id', idDeModulo) id: string, @Body() dto: ReordenarDto): Promise<void> {
    return this.estructura.reordenarUnidades(id, dto.ids);
  }

  @Patch('unidades/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  editarUnidad(@Param('id', idDeUnidad) id: string, @Body() dto: EditarUnidadDto): Promise<void> {
    return this.estructura.editarUnidad(id, dto.nombre);
  }

  @Delete('unidades/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarUnidad(
    @Param('id', idDeUnidad) id: string,
    @Body() dto: EliminarConEntradasDto,
  ): Promise<void> {
    return this.estructura.eliminarUnidad(id, dto);
  }

  @Get('categorias')
  categorias(): Promise<CategoriasAdminResponse> {
    return this.estructura.categorias();
  }

  @Post('categorias')
  @HttpCode(HttpStatus.CREATED)
  crearCategoria(@Body() dto: CrearCategoriaDto): Promise<CategoriaAdmin> {
    return this.estructura.crearCategoria(dto);
  }

  @Patch('categorias/orden')
  @HttpCode(HttpStatus.NO_CONTENT)
  reordenarCategorias(@Body() dto: ReordenarDto): Promise<void> {
    return this.estructura.reordenarCategorias(dto.ids);
  }

  @Patch('categorias/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  editarCategoria(
    @Param('id', idDeCategoria) id: string,
    @Body() dto: EditarCategoriaDto,
  ): Promise<void> {
    return this.estructura.editarCategoria(id, dto);
  }

  @Delete('categorias/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarCategoria(
    @Param('id', idDeCategoria) id: string,
    @Body() dto: EliminarConEntradasDto,
  ): Promise<void> {
    return this.estructura.eliminarCategoria(id, dto);
  }
}
