import { Injectable } from '@nestjs/common';
import {
  AccionLote,
  type AvanceDiccionarioResponse,
  type DuplicadosResponse,
  type EntradaAdmin,
  ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT,
  type EntradasAdminResponse,
  ESTADOS_SENA_ADMIN,
  EstadoModulo,
  type EstadoSenaAdmin,
  type LoteEntradasResponse,
  type TipoEntrada,
  type TramoModulo,
} from '@academia/types';
import type { Prisma } from '@prisma/client';

import {
  categoriaNotFound,
  entradaNotFound,
  moduloNotFound,
  unidadNoEsDelModulo,
} from '../../diccionario/diccionario.errors';
import { normalizarTexto, slugBase, slugUnico } from '../../diccionario/diccionario.normalizar';
import { PrismaService } from '../../prisma/prisma.service';
import {
  estadoSenaAdmin,
  SELECT_ENTRADA_ADMIN,
  toEntradaAdmin,
  whereSena,
} from './admin-diccionario.mapper';
import type { DuplicadosQueryDto } from './dto/duplicados-query.dto';
import type { CrearEntradaDto, EditarEntradaDto } from './dto/entrada.dto';
import type { EntradasAdminQueryDto } from './dto/entradas-admin-query.dto';
import type { LoteEntradasDto } from './dto/lote-entradas.dto';

type Db = Prisma.TransactionClient;

@Injectable()
export class AdminDiccionarioService {
  constructor(private readonly prisma: PrismaService) {}

  async avance(): Promise<AvanceDiccionarioResponse> {
    const [modulos, entradas, enPapelera] = await Promise.all([
      this.prisma.dictionaryModule.findMany({
        where: { estado: EstadoModulo.DISPONIBLE },
        orderBy: { orden: 'asc' },
      }),
      this.prisma.dictionaryEntry.findMany({
        where: { deletedAt: null, module: { estado: EstadoModulo.DISPONIBLE } },
        select: { moduleId: true, videos: { select: { estado: true } } },
      }),
      this.prisma.dictionaryEntry.count({ where: { deletedAt: { not: null } } }),
    ]);

    const avance = modulos.map((m) => {
      const estados = entradas
        .filter((e) => e.moduleId === m.id)
        .map((e) => estadoSenaAdmin(e.videos.map((v) => v.estado)));
      const cuantas = (estado: EstadoSenaAdmin) => estados.filter((e) => e === estado).length;
      return {
        numero: m.numero,
        nombre: m.nombre,
        tramo: m.tramo as TramoModulo,
        palabras: estados.length,
        conSena: cuantas('lista'),
        procesando: cuantas('procesando'),
        conError: cuantas('error'),
        sinSena: cuantas('sin-sena'),
      };
    });

    return {
      modulos: avance,
      totales: { sinSena: avance.reduce((t, m) => t + m.sinSena, 0), enPapelera },
    };
  }

  async listar(query: EntradasAdminQueryDto): Promise<EntradasAdminResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT;
    const q = query.q ? normalizarTexto(query.q) : '';

    const base: Prisma.DictionaryEntryWhereInput = {
      deletedAt: null,
      ...(q && { OR: [{ inglesNorm: { contains: q } }, { espanolNorm: { contains: q } }] }),
      ...(query.modulo !== undefined && { module: { numero: query.modulo } }),
      ...(query.categoria && { category: { slug: query.categoria } }),
      ...(query.tipo && { tipo: query.tipo }),
      ...(query.unidad && { unit: { codigo: query.unidad } }),
      ...(query.imagen && { imagenKey: query.imagen === 'con' ? { not: null } : null }),
      ...(query.publicada !== undefined && { publicada: query.publicada }),
    };
    const where = query.sena ? { AND: [base, whereSena(query.sena)] } : base;

    const [filas, total, ...conteos] = await Promise.all([
      this.prisma.dictionaryEntry.findMany({
        where,
        select: SELECT_ENTRADA_ADMIN,
        orderBy: [{ module: { numero: 'asc' } }, { category: { orden: 'asc' } }, { orden: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.dictionaryEntry.count({ where }),
      ...ESTADOS_SENA_ADMIN.map((estado) =>
        this.prisma.dictionaryEntry.count({ where: { AND: [base, whereSena(estado)] } }),
      ),
    ]);

    return {
      items: filas.map(toEntradaAdmin),
      total,
      page,
      pageSize,
      conteosSena: Object.fromEntries(
        ESTADOS_SENA_ADMIN.map((estado, i) => [estado, conteos[i] ?? 0]),
      ) as Record<EstadoSenaAdmin, number>,
    };
  }

  async obtener(id: string): Promise<EntradaAdmin> {
    const fila = await this.prisma.dictionaryEntry.findFirst({
      where: { id, deletedAt: null },
      select: SELECT_ENTRADA_ADMIN,
    });
    if (!fila) throw entradaNotFound();
    return toEntradaAdmin(fila);
  }

  async crear(dto: CrearEntradaDto): Promise<EntradaAdmin> {
    await this.validarDestino(this.prisma, dto.moduloId, dto.categoriaId, dto.unidadId ?? null);

    const base = slugBase(dto.ingles);
    const ocupados = await this.prisma.dictionaryEntry.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });

    const fila = await this.prisma.dictionaryEntry.create({
      data: {
        slug: slugUnico(base, new Set(ocupados.map((o) => o.slug))),
        ingles: dto.ingles,
        espanol: dto.espanol,
        inglesNorm: normalizarTexto(dto.ingles),
        espanolNorm: normalizarTexto(dto.espanol),
        tipo: dto.tipo,
        moduleId: dto.moduloId,
        unitId: dto.unidadId ?? null,
        categoryId: dto.categoriaId,
        nota: dto.nota ?? null,
        publicada: dto.publicada ?? true,
        orden: await this.siguienteOrden(this.prisma, dto.moduloId, dto.categoriaId),
      },
      select: SELECT_ENTRADA_ADMIN,
    });
    return toEntradaAdmin(fila);
  }

  /** El slug no se toca: las URLs ya compartidas siguen funcionando. */
  async editar(id: string, dto: EditarEntradaDto): Promise<EntradaAdmin> {
    const actual = await this.prisma.dictionaryEntry.findFirst({ where: { id, deletedAt: null } });
    if (!actual) throw entradaNotFound();

    const moduleId = dto.moduloId ?? actual.moduleId;
    const categoryId = dto.categoriaId ?? actual.categoryId;
    const cambiaDeLugar = moduleId !== actual.moduleId || categoryId !== actual.categoryId;
    const unitId =
      dto.unidadId !== undefined
        ? dto.unidadId
        : moduleId !== actual.moduleId
          ? null
          : actual.unitId;
    await this.validarDestino(this.prisma, moduleId, categoryId, unitId);

    const fila = await this.prisma.dictionaryEntry.update({
      where: { id },
      data: {
        ...(dto.ingles !== undefined && {
          ingles: dto.ingles,
          inglesNorm: normalizarTexto(dto.ingles),
        }),
        ...(dto.espanol !== undefined && {
          espanol: dto.espanol,
          espanolNorm: normalizarTexto(dto.espanol),
        }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.nota !== undefined && { nota: dto.nota }),
        ...(dto.publicada !== undefined && { publicada: dto.publicada }),
        moduleId,
        categoryId,
        unitId,
        ...(cambiaDeLugar && {
          orden: await this.siguienteOrden(this.prisma, moduleId, categoryId),
        }),
      },
      select: SELECT_ENTRADA_ADMIN,
    });
    return toEntradaAdmin(fila);
  }

  async duplicados(query: DuplicadosQueryDto): Promise<DuplicadosResponse> {
    const filas = await this.prisma.dictionaryEntry.findMany({
      where: {
        inglesNorm: normalizarTexto(query.ingles),
        deletedAt: null,
        ...(query.excluir && { id: { not: query.excluir } }),
      },
      select: {
        id: true,
        slug: true,
        ingles: true,
        espanol: true,
        tipo: true,
        module: { select: { numero: true, nombre: true, tramo: true } },
      },
      orderBy: [{ module: { numero: 'asc' } }, { orden: 'asc' }],
    });

    return {
      duplicados: filas
        .sort((a, b) => Number(b.tipo === query.tipo) - Number(a.tipo === query.tipo))
        .map((f) => ({
          id: f.id,
          slug: f.slug,
          ingles: f.ingles,
          espanol: f.espanol,
          tipo: f.tipo as TipoEntrada,
          modulo: {
            numero: f.module.numero,
            nombre: f.module.nombre,
            tramo: f.module.tramo as TramoModulo,
          },
        })),
    };
  }

  /** Todo o nada: si una entrada no existe o el destino no vale, ninguna cambia. */
  async lote(dto: LoteEntradasDto): Promise<LoteEntradasResponse> {
    return this.prisma.$transaction(async (tx) => {
      const entradas = await tx.dictionaryEntry.findMany({
        where: { id: { in: dto.ids }, deletedAt: null },
        select: { id: true, moduleId: true, categoryId: true },
        orderBy: { orden: 'asc' },
      });
      if (entradas.length !== dto.ids.length) throw entradaNotFound();
      const ids = { id: { in: dto.ids } };

      switch (dto.accion) {
        case AccionLote.PUBLICAR:
        case AccionLote.OCULTAR:
          await tx.dictionaryEntry.updateMany({
            where: ids,
            data: { publicada: dto.accion === AccionLote.PUBLICAR },
          });
          break;
        case AccionLote.ENVIAR_PAPELERA:
          await tx.dictionaryEntry.updateMany({ where: ids, data: { deletedAt: new Date() } });
          break;
        case AccionLote.MOVER_CATEGORIA: {
          const categoryId = dto.categoriaId as string;
          if (
            !(await tx.dictionaryCategory.findFirst({ where: { id: categoryId, deletedAt: null } }))
          ) {
            throw categoriaNotFound();
          }
          for (const e of entradas) {
            if (e.categoryId === categoryId) continue;
            const orden = await this.siguienteOrden(tx, e.moduleId, categoryId);
            await tx.dictionaryEntry.update({ where: { id: e.id }, data: { categoryId, orden } });
          }
          break;
        }
        case AccionLote.MOVER_MODULO: {
          const moduleId = dto.moduloId as string;
          const unitId = dto.unidadId ?? null;
          for (const e of entradas) {
            await this.validarDestino(tx, moduleId, e.categoryId, unitId);
            const orden =
              e.moduleId === moduleId
                ? undefined
                : await this.siguienteOrden(tx, moduleId, e.categoryId);
            await tx.dictionaryEntry.update({
              where: { id: e.id },
              data: { moduleId, unitId, ...(orden !== undefined && { orden }) },
            });
          }
          break;
        }
      }

      return { actualizadas: entradas.length };
    });
  }

  private async validarDestino(
    db: Db,
    moduleId: string,
    categoryId: string,
    unitId: string | null,
  ): Promise<void> {
    const [modulo, categoria, unidad] = await Promise.all([
      db.dictionaryModule.findUnique({ where: { id: moduleId }, select: { id: true } }),
      db.dictionaryCategory.findFirst({
        where: { id: categoryId, deletedAt: null },
        select: { id: true },
      }),
      unitId
        ? db.dictionaryUnit.findFirst({
            where: { id: unitId, deletedAt: null },
            select: { moduleId: true },
          })
        : null,
    ]);
    if (!modulo) throw moduloNotFound();
    if (!categoria) throw categoriaNotFound();
    if (unitId && unidad?.moduleId !== moduleId) throw unidadNoEsDelModulo();
  }

  private async siguienteOrden(db: Db, moduleId: string, categoryId: string): Promise<number> {
    const { _max } = await db.dictionaryEntry.aggregate({
      where: { moduleId, categoryId },
      _max: { orden: true },
    });
    return (_max.orden ?? 0) + 1;
  }
}
