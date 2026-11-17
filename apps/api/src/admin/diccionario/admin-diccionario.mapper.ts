import {
  type EntradaAdmin,
  EstadoVideo,
  type EstadoSenaAdmin,
  type TipoEntrada,
  type TramoModulo,
} from '@academia/types';
import type { Prisma } from '@prisma/client';

export const SELECT_ENTRADA_ADMIN = {
  id: true,
  slug: true,
  ingles: true,
  espanol: true,
  tipo: true,
  nota: true,
  publicada: true,
  orden: true,
  imagenKey: true,
  updatedAt: true,
  module: { select: { id: true, numero: true, nombre: true, tramo: true } },
  unit: { select: { id: true, codigo: true, nombre: true } },
  category: { select: { id: true, slug: true, nombre: true, icono: true } },
  videos: { select: { estado: true } },
} satisfies Prisma.DictionaryEntrySelect;

export type FilaEntradaAdmin = Prisma.DictionaryEntryGetPayload<{
  select: typeof SELECT_ENTRADA_ADMIN;
}>;

const EN_CURSO: string[] = [EstadoVideo.SUBIENDO, EstadoVideo.PROCESANDO];

/** Lista > procesando > error > sin seña; el mismo criterio que `whereSena()`. */
export function estadoSenaAdmin(estados: readonly string[]): EstadoSenaAdmin {
  if (estados.includes(EstadoVideo.LISTO)) return 'lista';
  if (estados.some((e) => EN_CURSO.includes(e))) return 'procesando';
  if (estados.includes(EstadoVideo.ERROR)) return 'error';
  return 'sin-sena';
}

export function whereSena(estado: EstadoSenaAdmin): Prisma.DictionaryEntryWhereInput {
  const lista = { videos: { some: { estado: EstadoVideo.LISTO } } };
  const enCurso = {
    videos: { some: { estado: { in: [EstadoVideo.SUBIENDO, EstadoVideo.PROCESANDO] } } },
  };
  const conError = { videos: { some: { estado: EstadoVideo.ERROR } } };
  switch (estado) {
    case 'lista':
      return lista;
    case 'procesando':
      return { AND: [{ NOT: lista }, enCurso] };
    case 'error':
      return { AND: [{ NOT: lista }, { NOT: enCurso }, conError] };
    case 'sin-sena':
      return { videos: { none: {} } };
  }
}

export function toEntradaAdmin(e: FilaEntradaAdmin): EntradaAdmin {
  return {
    id: e.id,
    slug: e.slug,
    ingles: e.ingles,
    espanol: e.espanol,
    tipo: e.tipo as TipoEntrada,
    nota: e.nota,
    publicada: e.publicada,
    orden: e.orden,
    modulo: {
      id: e.module.id,
      numero: e.module.numero,
      nombre: e.module.nombre,
      tramo: e.module.tramo as TramoModulo,
    },
    unidad: e.unit ? { id: e.unit.id, codigo: e.unit.codigo, nombre: e.unit.nombre } : null,
    categoria: {
      id: e.category.id,
      slug: e.category.slug,
      nombre: e.category.nombre,
      icono: e.category.icono,
    },
    sena: { estado: estadoSenaAdmin(e.videos.map((v) => v.estado)) },
    tieneImagen: e.imagenKey !== null,
    updatedAt: e.updatedAt.toISOString(),
  };
}
