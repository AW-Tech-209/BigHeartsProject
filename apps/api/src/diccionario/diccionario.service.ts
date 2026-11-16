import { Injectable } from '@nestjs/common';
import {
  BUSQUEDA_LIMITE_DEFAULT,
  type BusquedaResponse,
  type CategoriaConConteo,
  type CategoriaDetalleResponse,
  type DiccionarioInicioResponse,
  type EntradaDetalleResponse,
  EstadoModulo,
  type ModuloDetalleResponse,
  type ModuloResumen,
  type TipoEntrada,
} from '@academia/types';
import { Prisma } from '@prisma/client';

import {
  AlmacenamientoMedios,
  TTL_LECTURA_SEGUNDOS,
} from '../almacenamiento/almacenamiento-medios';
import { PrismaService } from '../prisma/prisma.service';
import {
  categoriaNotFound,
  entradaNotFound,
  moduloNoDisponible,
  moduloNotFound,
} from './diccionario.errors';
import {
  clavesDeVideos,
  compararEntradas,
  ENTRADA_VISIBLE,
  SELECT_ENTRADA,
  toCategoriaRef,
  toEntradaResumen,
  toModuloRef,
  toSena,
  toUnidadRef,
  toVecina,
  VIDEO_LISTO,
} from './diccionario.mapper';
import type { BuscarQueryDto } from './dto/buscar-query.dto';
import type { CategoriaQueryDto } from './dto/categoria-query.dto';
import type { ModuloQueryDto } from './dto/modulo-query.dto';

const CON_SENA = { videos: { some: VIDEO_LISTO.where } } satisfies Prisma.DictionaryEntryWhereInput;

@Injectable()
export class DiccionarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly almacenamiento: AlmacenamientoMedios,
  ) {}

  async inicio(): Promise<DiccionarioInicioResponse> {
    const [modulos, palabras, conSena] = await Promise.all([
      this.prisma.dictionaryModule.findMany({ orderBy: { orden: 'asc' } }),
      this.contarPorModulo(ENTRADA_VISIBLE),
      this.contarPorModulo({ ...ENTRADA_VISIBLE, ...CON_SENA }),
    ]);

    return {
      modulos: modulos.map((m) => ({
        ...toModuloRef(m),
        estado: m.estado as EstadoModulo,
        palabras: palabras.get(m.id) ?? 0,
        conSena: conSena.get(m.id) ?? 0,
      })),
    };
  }

  async modulo(numero: number, query: ModuloQueryDto): Promise<ModuloDetalleResponse> {
    const modulo = await this.moduloDisponible(numero);
    const unidad = query.unidad ?? null;

    const [unidades, entradas] = await Promise.all([
      this.prisma.dictionaryUnit.findMany({
        where: { moduleId: modulo.id, deletedAt: null },
        orderBy: { orden: 'asc' },
      }),
      this.prisma.dictionaryEntry.findMany({
        where: { ...ENTRADA_VISIBLE, moduleId: modulo.id },
        select: { unitId: true, categoryId: true, videos: VIDEO_LISTO },
      }),
    ]);

    const unidadElegida = unidades.find((u) => u.codigo === unidad);
    const porCategoria = new Map<string, number>();
    for (const e of entradas) {
      if (unidad !== null && e.unitId !== unidadElegida?.id) continue;
      porCategoria.set(e.categoryId, (porCategoria.get(e.categoryId) ?? 0) + 1);
    }
    const categorias = await this.prisma.dictionaryCategory.findMany({
      where: { id: { in: [...porCategoria.keys()] } },
    });

    const resumen: ModuloResumen = {
      ...toModuloRef(modulo),
      estado: modulo.estado as EstadoModulo,
      palabras: entradas.length,
      conSena: entradas.filter((e) => e.videos.length > 0).length,
    };

    return {
      modulo: resumen,
      unidad,
      unidades: unidades.map((u) => ({
        codigo: u.codigo,
        nombre: u.nombre,
        palabras: entradas.filter((e) => e.unitId === u.id).length,
      })),
      categorias: categorias
        .map((c) => ({ c, palabras: porCategoria.get(c.id) ?? 0 }))
        .sort((a, b) => b.palabras - a.palabras || a.c.orden - b.c.orden)
        .map(({ c, palabras }): CategoriaConConteo => ({
          ...toCategoriaRef(c),
          descripcion: c.descripcion,
          palabras,
        })),
    };
  }

  async categoria(
    numero: number,
    slug: string,
    query: CategoriaQueryDto,
  ): Promise<CategoriaDetalleResponse> {
    const modulo = await this.moduloDisponible(numero);
    const categoria = await this.prisma.dictionaryCategory.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!categoria) throw categoriaNotFound();

    const todas = (
      await this.prisma.dictionaryEntry.findMany({
        where: { ...ENTRADA_VISIBLE, moduleId: modulo.id, categoryId: categoria.id },
        select: SELECT_ENTRADA,
      })
    ).sort(compararEntradas);

    const tipos: Partial<Record<TipoEntrada, number>> = {};
    const unidades = new Map<string, { codigo: string; nombre: string; palabras: number }>();
    for (const e of todas) {
      const tipo = e.tipo as TipoEntrada;
      tipos[tipo] = (tipos[tipo] ?? 0) + 1;
      if (e.unit) {
        const u = unidades.get(e.unit.codigo) ?? {
          codigo: e.unit.codigo,
          nombre: e.unit.nombre,
          palabras: 0,
        };
        u.palabras++;
        unidades.set(u.codigo, u);
      }
    }

    const entradas = todas.filter(
      (e) =>
        (!query.tipo || e.tipo === query.tipo) &&
        (!query.unidad || e.unit?.codigo === query.unidad) &&
        (!query.conSena || e.videos.length > 0),
    );

    const urls = await this.firmar(entradas.flatMap((e) => clavesDeVideos(e.videos)));

    return {
      modulo: toModuloRef(modulo),
      categoria: { ...toCategoriaRef(categoria), descripcion: categoria.descripcion },
      entradas: entradas.map((e) => toEntradaResumen(e, urls)),
      filtros: {
        tipos,
        unidades: [...unidades.values()],
        conSena: todas.filter((e) => e.videos.length > 0).length,
        total: todas.length,
      },
    };
  }

  async entrada(slug: string): Promise<EntradaDetalleResponse> {
    const entrada = await this.prisma.dictionaryEntry.findFirst({
      where: { ...ENTRADA_VISIBLE, slug },
      include: { module: true, unit: true, category: true, videos: VIDEO_LISTO },
    });
    if (!entrada) throw entradaNotFound();

    const hermanas = (
      await this.prisma.dictionaryEntry.findMany({
        where: { ...ENTRADA_VISIBLE, moduleId: entrada.moduleId, categoryId: entrada.categoryId },
        select: {
          slug: true,
          ingles: true,
          espanol: true,
          orden: true,
          unit: { select: { orden: true } },
        },
      })
    ).sort(compararEntradas);
    const i = hermanas.findIndex((h) => h.slug === entrada.slug);
    const urls = await this.firmar([
      ...clavesDeVideos(entrada.videos),
      ...(entrada.imagenKey ? [entrada.imagenKey] : []),
    ]);

    return {
      slug: entrada.slug,
      ingles: entrada.ingles,
      espanol: entrada.espanol,
      tipo: entrada.tipo as TipoEntrada,
      modulo: toModuloRef(entrada.module),
      unidad: toUnidadRef(entrada.unit),
      categoria: toCategoriaRef(entrada.category),
      nota: entrada.nota,
      imagenUrl: entrada.imagenKey ? (urls.get(entrada.imagenKey) ?? null) : null,
      sena: toSena(entrada.videos, urls),
      posicion: { actual: i + 1, total: hermanas.length },
      anterior: toVecina(hermanas[i - 1]),
      siguiente: toVecina(hermanas[i + 1]),
    };
  }

  async buscar(query: BuscarQueryDto): Promise<BusquedaResponse> {
    const q = query.q;
    const limite = query.limite ?? BUSQUEDA_LIMITE_DEFAULT;
    const like = q.replace(/[\\%_]/g, (c) => `\\${c}`);

    // `%` usa el índice trigram con el umbral por defecto de pg_trgm (0.3).
    const filas = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT e.id
      FROM dictionary_entries e
      JOIN dictionary_modules m ON m.id = e.module_id
      WHERE e.deleted_at IS NULL AND e.publicada AND m.estado = 'DISPONIBLE'
        AND (e.ingles_norm LIKE '%' || ${like} || '%' OR e.espanol_norm LIKE '%' || ${like} || '%'
             OR e.ingles_norm % ${q} OR e.espanol_norm % ${q})
      ORDER BY
        CASE
          WHEN e.ingles_norm = ${q} OR e.espanol_norm = ${q} THEN 0
          WHEN e.ingles_norm LIKE ${like} || '%' OR e.espanol_norm LIKE ${like} || '%' THEN 1
          WHEN e.ingles_norm LIKE '%' || ${like} || '%' OR e.espanol_norm LIKE '%' || ${like} || '%' THEN 2
          ELSE 3
        END,
        GREATEST(similarity(e.ingles_norm, ${q}), similarity(e.espanol_norm, ${q})) DESC,
        e.ingles_norm
      LIMIT ${limite}
    `);

    const ids = filas.map((f) => f.id);
    const entradas = await this.prisma.dictionaryEntry.findMany({
      where: { id: { in: ids } },
      include: { module: true, category: true, videos: VIDEO_LISTO },
    });
    const porId = new Map(entradas.map((e) => [e.id, e]));
    const urls = await this.firmar(entradas.flatMap((e) => clavesDeVideos(e.videos)));

    return {
      q,
      resultados: ids.flatMap((id) => {
        const e = porId.get(id);
        if (!e) return [];
        return [
          {
            slug: e.slug,
            ingles: e.ingles,
            espanol: e.espanol,
            tipo: e.tipo as TipoEntrada,
            modulo: toModuloRef(e.module),
            categoria: toCategoriaRef(e.category),
            sena: toSena(e.videos, urls),
          },
        ];
      }),
    };
  }

  private firmar(claves: string[]): Promise<Map<string, string>> {
    return this.almacenamiento.urlsDeLectura(claves, TTL_LECTURA_SEGUNDOS);
  }

  private async moduloDisponible(numero: number) {
    const modulo = await this.prisma.dictionaryModule.findUnique({ where: { numero } });
    if (!modulo) throw moduloNotFound();
    if (modulo.estado !== EstadoModulo.DISPONIBLE) throw moduloNoDisponible();
    return modulo;
  }

  private async contarPorModulo(
    where: Prisma.DictionaryEntryWhereInput,
  ): Promise<Map<string, number>> {
    const grupos = await this.prisma.dictionaryEntry.groupBy({
      by: ['moduleId'],
      where,
      _count: { _all: true },
    });
    return new Map(grupos.map((g) => [g.moduleId, g._count._all]));
  }
}
