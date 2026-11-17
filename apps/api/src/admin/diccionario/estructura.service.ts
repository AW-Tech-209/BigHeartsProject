import { Injectable } from '@nestjs/common';
import {
  type CategoriaAdmin,
  type CategoriasAdminResponse,
  type EstadoModulo,
  type ModulosAdminResponse,
  type TramoModulo,
  type UnidadAdmin,
} from '@academia/types';
import type { Prisma } from '@prisma/client';

import {
  categoriaNotFound,
  moduloNotFound,
  ordenNoCoincide,
  tieneEntradas,
  unidadNoEsDelModulo,
  unidadNotFound,
} from '../../diccionario/diccionario.errors';
import { slugBase, slugUnico } from '../../diccionario/diccionario.normalizar';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CrearCategoriaDto,
  EditarCategoriaDto,
  EditarModuloDto,
  EliminarConEntradasDto,
} from './dto/estructura.dto';

type Db = Prisma.TransactionClient;
const VIVA = { deletedAt: null };

/** Módulos, unidades y categorías. Lo eliminado con entradas en la papelera queda oculto (D52). */
@Injectable()
export class EstructuraService {
  constructor(private readonly prisma: PrismaService) {}

  async modulos(): Promise<ModulosAdminResponse> {
    const [modulos, entradas] = await Promise.all([
      this.prisma.dictionaryModule.findMany({
        orderBy: { orden: 'asc' },
        include: { unidades: { where: VIVA, orderBy: { orden: 'asc' } } },
      }),
      this.prisma.dictionaryEntry.findMany({
        where: VIVA,
        select: { moduleId: true, unitId: true },
      }),
    ]);

    return {
      modulos: modulos.map((m) => ({
        id: m.id,
        numero: m.numero,
        nombre: m.nombre,
        tramo: m.tramo as TramoModulo,
        estado: m.estado as EstadoModulo,
        orden: m.orden,
        palabras: entradas.filter((e) => e.moduleId === m.id).length,
        unidades: m.unidades.map((u): UnidadAdmin => ({
          id: u.id,
          codigo: u.codigo,
          nombre: u.nombre,
          orden: u.orden,
          palabras: entradas.filter((e) => e.unitId === u.id).length,
        })),
      })),
    };
  }

  /** Pasar a PROXIMAMENTE oculta sus entradas de la lectura; no las borra. */
  async editarModulo(id: string, dto: EditarModuloDto): Promise<void> {
    const { count } = await this.prisma.dictionaryModule.updateMany({ where: { id }, data: dto });
    if (count === 0) throw moduloNotFound();
  }

  async reordenarModulos(ids: string[]): Promise<void> {
    const actuales = await this.prisma.dictionaryModule.findMany({ select: { id: true } });
    await this.reordenar(actuales, ids, (tx, id, orden) =>
      tx.dictionaryModule.update({ where: { id }, data: { orden } }),
    );
  }

  /** El código sigue al mayor que haya existido en el módulo: «U7» no se reutiliza. */
  async crearUnidad(moduleId: string, nombre: string): Promise<UnidadAdmin> {
    if (!(await this.prisma.dictionaryModule.findUnique({ where: { id: moduleId } }))) {
      throw moduloNotFound();
    }
    const todas = await this.prisma.dictionaryUnit.findMany({ where: { moduleId } });
    const numero = Math.max(0, ...todas.map((u) => Number(u.codigo.slice(1)) || 0)) + 1;
    const orden = Math.max(0, ...todas.filter((u) => !u.deletedAt).map((u) => u.orden)) + 1;

    const unidad = await this.prisma.dictionaryUnit.create({
      data: { moduleId, codigo: `U${numero}`, nombre, orden },
    });
    return { id: unidad.id, codigo: unidad.codigo, nombre: unidad.nombre, orden, palabras: 0 };
  }

  async editarUnidad(id: string, nombre: string): Promise<void> {
    const { count } = await this.prisma.dictionaryUnit.updateMany({
      where: { id, ...VIVA },
      data: { nombre },
    });
    if (count === 0) throw unidadNotFound();
  }

  async reordenarUnidades(moduleId: string, ids: string[]): Promise<void> {
    const actuales = await this.prisma.dictionaryUnit.findMany({
      where: { moduleId, ...VIVA },
      select: { id: true },
    });
    await this.reordenar(actuales, ids, (tx, id, orden) =>
      tx.dictionaryUnit.update({ where: { id }, data: { orden } }),
    );
  }

  async eliminarUnidad(id: string, dto: EliminarConEntradasDto): Promise<void> {
    const unidad = await this.prisma.dictionaryUnit.findFirst({ where: { id, ...VIVA } });
    if (!unidad) throw unidadNotFound();
    const vivas = await this.prisma.dictionaryEntry.count({ where: { unitId: id, ...VIVA } });
    if (vivas > 0 && !dto.destino) throw tieneEntradas(vivas);

    await this.prisma.$transaction(async (tx) => {
      if (dto.destino === 'mover') {
        const hacia = await tx.dictionaryUnit.findFirst({ where: { id: dto.haciaId, ...VIVA } });
        if (!hacia || hacia.id === id) throw unidadNotFound();
        if (hacia.moduleId !== unidad.moduleId) throw unidadNoEsDelModulo();
        await tx.dictionaryEntry.updateMany({ where: { unitId: id }, data: { unitId: hacia.id } });
      } else if (dto.destino === 'papelera') {
        await tx.dictionaryEntry.updateMany({
          where: { unitId: id, ...VIVA },
          data: { deletedAt: new Date() },
        });
      }

      const enPapelera = await tx.dictionaryEntry.count({ where: { unitId: id } });
      if (enPapelera > 0) {
        await tx.dictionaryUnit.update({ where: { id }, data: { deletedAt: new Date() } });
      } else {
        await tx.dictionaryUnit.delete({ where: { id } });
      }
    });
  }

  async categorias(): Promise<CategoriasAdminResponse> {
    const [categorias, conteos] = await Promise.all([
      this.prisma.dictionaryCategory.findMany({ where: VIVA, orderBy: { orden: 'asc' } }),
      this.prisma.dictionaryEntry.groupBy({
        by: ['categoryId'],
        where: VIVA,
        _count: { _all: true },
      }),
    ]);
    const porCategoria = new Map(conteos.map((c) => [c.categoryId, c._count._all]));

    return {
      categorias: categorias.map((c) => this.toCategoriaAdmin(c, porCategoria.get(c.id) ?? 0)),
    };
  }

  async crearCategoria(dto: CrearCategoriaDto): Promise<CategoriaAdmin> {
    const todas = await this.prisma.dictionaryCategory.findMany({
      select: { slug: true, orden: true },
    });
    const categoria = await this.prisma.dictionaryCategory.create({
      data: {
        nombre: dto.nombre,
        slug: slugUnico(slugBase(dto.nombre), new Set(todas.map((c) => c.slug))),
        icono: dto.icono,
        descripcion: dto.descripcion ?? null,
        orden: Math.max(0, ...todas.map((c) => c.orden)) + 1,
      },
    });
    return this.toCategoriaAdmin(categoria, 0);
  }

  /** El slug no cambia al renombrar: las URLs compartidas siguen funcionando. */
  async editarCategoria(id: string, dto: EditarCategoriaDto): Promise<void> {
    const { count } = await this.prisma.dictionaryCategory.updateMany({
      where: { id, ...VIVA },
      data: dto,
    });
    if (count === 0) throw categoriaNotFound();
  }

  async reordenarCategorias(ids: string[]): Promise<void> {
    const actuales = await this.prisma.dictionaryCategory.findMany({
      where: VIVA,
      select: { id: true },
    });
    await this.reordenar(actuales, ids, (tx, id, orden) =>
      tx.dictionaryCategory.update({ where: { id }, data: { orden } }),
    );
  }

  async eliminarCategoria(id: string, dto: EliminarConEntradasDto): Promise<void> {
    const categoria = await this.prisma.dictionaryCategory.findFirst({ where: { id, ...VIVA } });
    if (!categoria) throw categoriaNotFound();
    const vivas = await this.prisma.dictionaryEntry.count({ where: { categoryId: id, ...VIVA } });
    if (vivas > 0 && !dto.destino) throw tieneEntradas(vivas);

    await this.prisma.$transaction(async (tx) => {
      if (dto.destino === 'mover') {
        const hacia = await tx.dictionaryCategory.findFirst({
          where: { id: dto.haciaId, ...VIVA },
        });
        if (!hacia || hacia.id === id) throw categoriaNotFound();
        const movidas = await tx.dictionaryEntry.findMany({
          where: { categoryId: id },
          orderBy: { orden: 'asc' },
          select: { id: true, moduleId: true },
        });
        for (const e of movidas) {
          const { _max } = await tx.dictionaryEntry.aggregate({
            where: { moduleId: e.moduleId, categoryId: hacia.id },
            _max: { orden: true },
          });
          await tx.dictionaryEntry.update({
            where: { id: e.id },
            data: { categoryId: hacia.id, orden: (_max.orden ?? 0) + 1 },
          });
        }
      } else if (dto.destino === 'papelera') {
        await tx.dictionaryEntry.updateMany({
          where: { categoryId: id, ...VIVA },
          data: { deletedAt: new Date() },
        });
      }

      const enPapelera = await tx.dictionaryEntry.count({ where: { categoryId: id } });
      if (enPapelera > 0) {
        // Libera el slug para que una categoría nueva pueda usarlo.
        await tx.dictionaryCategory.update({
          where: { id },
          data: { deletedAt: new Date(), slug: `${categoria.slug}--eliminada-${id.slice(0, 8)}` },
        });
      } else {
        await tx.dictionaryCategory.delete({ where: { id } });
      }
    });
  }

  private async reordenar(
    actuales: { id: string }[],
    ids: string[],
    actualizar: (tx: Db, id: string, orden: number) => Promise<unknown>,
  ): Promise<void> {
    const esperados = new Set(actuales.map((a) => a.id));
    if (ids.length !== esperados.size || !ids.every((id) => esperados.has(id)))
      throw ordenNoCoincide();
    await this.prisma.$transaction(async (tx) => {
      for (const [i, id] of ids.entries()) await actualizar(tx, id, i + 1);
    });
  }

  private toCategoriaAdmin(
    c: {
      id: string;
      slug: string;
      nombre: string;
      icono: string;
      descripcion: string | null;
      orden: number;
    },
    palabras: number,
  ): CategoriaAdmin {
    return {
      id: c.id,
      slug: c.slug,
      nombre: c.nombre,
      icono: c.icono,
      descripcion: c.descripcion,
      orden: c.orden,
      palabras,
    };
  }
}
