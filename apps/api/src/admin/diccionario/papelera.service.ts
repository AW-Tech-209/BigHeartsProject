import { Injectable } from '@nestjs/common';
import {
  type DestinoFaltante,
  type PapeleraResponse,
  type PurgaResponse,
  type TipoEntrada,
  type TramoModulo,
} from '@academia/types';

import { AppConfigService } from '../../config/app-config.service';
import {
  categoriaNotFound,
  destinoDeRestaurarFaltante,
  entradaNotFound,
  unidadNoEsDelModulo,
} from '../../diccionario/diccionario.errors';
import { PrismaService } from '../../prisma/prisma.service';
import type { RestaurarEntradaDto } from './dto/estructura.dto';
import { MediosService } from './medios.service';

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días enteros que le quedan en la papelera (0 = se elimina hoy). */
export function quedanDias(eliminadaEl: Date, diasDeRetencion: number, ahora = new Date()): number {
  const vence = eliminadaEl.getTime() + diasDeRetencion * DIA_MS;
  return Math.max(0, Math.ceil((vence - ahora.getTime()) / DIA_MS));
}

/** Papelera de 30 días (D52): restaurar devuelve la entrada igual que estaba. */
@Injectable()
export class PapeleraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly medios: MediosService,
    private readonly config: AppConfigService,
  ) {}

  async enviar(id: string): Promise<void> {
    const { count } = await this.prisma.dictionaryEntry.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) throw entradaNotFound();
  }

  async listar(ahora = new Date()): Promise<PapeleraResponse> {
    const dias = this.config.papeleraDias;
    const filas = await this.prisma.dictionaryEntry.findMany({
      where: { deletedAt: { not: null } },
      include: { module: true, unit: true, category: true },
      orderBy: { deletedAt: 'desc' },
    });

    return {
      diasDeRetencion: dias,
      entradas: filas.map((e) => ({
        id: e.id,
        slug: e.slug,
        ingles: e.ingles,
        espanol: e.espanol,
        tipo: e.tipo as TipoEntrada,
        modulo: {
          numero: e.module.numero,
          nombre: e.module.nombre,
          tramo: e.module.tramo as TramoModulo,
        },
        unidad: e.unit ? { codigo: e.unit.codigo, nombre: e.unit.nombre } : null,
        categoria: { slug: e.category.slug, nombre: e.category.nombre, icono: e.category.icono },
        eliminadaEl: (e.deletedAt as Date).toISOString(),
        quedanDias: quedanDias(e.deletedAt as Date, dias, ahora),
      })),
    };
  }

  /** Si su categoría o unidad ya no existe, 409 con el detalle salvo que llegue un destino nuevo. */
  async restaurar(id: string, dto: RestaurarEntradaDto): Promise<void> {
    const entrada = await this.prisma.dictionaryEntry.findFirst({
      where: { id, deletedAt: { not: null } },
      include: { unit: true, category: true },
    });
    if (!entrada) throw entradaNotFound();

    const faltante: DestinoFaltante = {};
    let categoryId = entrada.categoryId;
    if (dto.categoriaId) {
      const nueva = await this.prisma.dictionaryCategory.findFirst({
        where: { id: dto.categoriaId, deletedAt: null },
      });
      if (!nueva) throw categoriaNotFound();
      categoryId = nueva.id;
    } else if (entrada.category.deletedAt) {
      faltante.categoria = { nombre: entrada.category.nombre };
    }

    let unitId = entrada.unitId;
    if (dto.unidadId !== undefined) {
      if (dto.unidadId !== null) {
        const nueva = await this.prisma.dictionaryUnit.findFirst({
          where: { id: dto.unidadId, deletedAt: null },
        });
        if (nueva?.moduleId !== entrada.moduleId) throw unidadNoEsDelModulo();
      }
      unitId = dto.unidadId;
    } else if (entrada.unit?.deletedAt) {
      faltante.unidad = { codigo: entrada.unit.codigo, nombre: entrada.unit.nombre };
    }

    if (faltante.categoria || faltante.unidad) throw destinoDeRestaurarFaltante(faltante);

    const cambiaDeCategoria = categoryId !== entrada.categoryId;
    const orden = cambiaDeCategoria
      ? ((
          await this.prisma.dictionaryEntry.aggregate({
            where: { moduleId: entrada.moduleId, categoryId },
            _max: { orden: true },
          })
        )._max.orden ?? 0) + 1
      : entrada.orden;

    await this.prisma.dictionaryEntry.update({
      where: { id },
      data: { deletedAt: null, categoryId, unitId, orden },
    });
  }

  async eliminarParaSiempre(id: string): Promise<PurgaResponse> {
    const entrada = await this.prisma.dictionaryEntry.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { id: true },
    });
    if (!entrada) throw entradaNotFound();
    return this.purgar([entrada.id]);
  }

  async vaciar(): Promise<PurgaResponse> {
    const filas = await this.prisma.dictionaryEntry.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    });
    return this.purgar(filas.map((f) => f.id));
  }

  /** Borra archivos y filas; luego, las unidades y categorías eliminadas que ya no tienen a nadie. */
  async purgar(ids: string[]): Promise<PurgaResponse> {
    if (ids.length === 0) return { eliminadas: 0 };
    await this.medios.borrarMediosDeEntradas(ids);
    const { count } = await this.prisma.dictionaryEntry.deleteMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
    });
    await this.prisma.dictionaryUnit.deleteMany({
      where: { deletedAt: { not: null }, entradas: { none: {} } },
    });
    await this.prisma.dictionaryCategory.deleteMany({
      where: { deletedAt: { not: null }, entradas: { none: {} } },
    });
    return { eliminadas: count };
  }
}
