import {
  type CategoriaRef,
  EstadoModulo,
  EstadoVideo,
  type EntradaResumen,
  type EntradaVecina,
  LenguaSenas,
  type ModuloRef,
  type SenaEntrada,
  type TipoEntrada,
  type TramoModulo,
  type UnidadRef,
} from '@academia/types';
import type { Prisma } from '@prisma/client';

/** Lo único legible: publicada, fuera de la papelera y de un módulo disponible. */
export const ENTRADA_VISIBLE = {
  publicada: true,
  deletedAt: null,
  module: { estado: EstadoModulo.DISPONIBLE },
} satisfies Prisma.DictionaryEntryWhereInput;

/** Solo el video activo; `PROCESANDO`/`ERROR` nunca salen de la lectura. */
export const VIDEO_LISTO = {
  where: { estado: EstadoVideo.LISTO, lengua: LenguaSenas.LSC },
  select: { id: true },
  take: 1,
} satisfies Prisma.DictionaryEntry$videosArgs;

export const SELECT_ENTRADA = {
  slug: true,
  ingles: true,
  espanol: true,
  tipo: true,
  orden: true,
  unit: { select: { codigo: true, nombre: true, orden: true } },
  videos: VIDEO_LISTO,
} satisfies Prisma.DictionaryEntrySelect;

export type FilaEntrada = Prisma.DictionaryEntryGetPayload<{ select: typeof SELECT_ENTRADA }>;

/** Por unidad (las sin unidad al final) y luego por el orden del material del profe. */
interface Ordenable {
  orden: number;
  unit: { orden: number } | null;
}

export function compararEntradas(a: Ordenable, b: Ordenable): number {
  const ua = a.unit?.orden ?? Number.MAX_SAFE_INTEGER;
  const ub = b.unit?.orden ?? Number.MAX_SAFE_INTEGER;
  return ua - ub || a.orden - b.orden;
}

// Las URLs firmadas llegan con el almacenamiento; hasta entonces van en null.
export function toSena(videos: readonly { id: string }[]): SenaEntrada {
  return { estado: videos.length > 0 ? 'lista' : 'en-preparacion', url: null, miniaturaUrl: null };
}

export function toModuloRef(m: { numero: number; nombre: string; tramo: string }): ModuloRef {
  return { numero: m.numero, nombre: m.nombre, tramo: m.tramo as TramoModulo };
}

export function toCategoriaRef(c: { slug: string; nombre: string; icono: string }): CategoriaRef {
  return { slug: c.slug, nombre: c.nombre, icono: c.icono };
}

export function toUnidadRef(u: { codigo: string; nombre: string } | null): UnidadRef | null {
  return u ? { codigo: u.codigo, nombre: u.nombre } : null;
}

export function toEntradaResumen(e: FilaEntrada): EntradaResumen {
  return {
    slug: e.slug,
    ingles: e.ingles,
    espanol: e.espanol,
    tipo: e.tipo as TipoEntrada,
    unidad: toUnidadRef(e.unit),
    sena: toSena(e.videos),
  };
}

export function toVecina(
  e: Pick<FilaEntrada, 'slug' | 'ingles' | 'espanol'> | undefined,
): EntradaVecina | null {
  return e ? { slug: e.slug, ingles: e.ingles, espanol: e.espanol } : null;
}
