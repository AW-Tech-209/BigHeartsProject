import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ApiErrorCode,
  type EstadoFilaImportacion,
  type FilaImportacion,
  type ResumenImportacion,
  type TipoEntrada,
} from '@academia/types';
import type { Prisma, PrismaClient } from '@prisma/client';

import {
  filasCsv,
  normalizarTexto,
  slugBase,
  slugUnico,
  tipoDesdeEtiqueta,
} from './diccionario.normalizar';

type Db = PrismaClient | Prisma.TransactionClient;

const OBLIGATORIAS = ['modulo', 'unidad', 'categoria', 'tipo', 'ingles', 'espanol'] as const;
const CODIGO_UNIDAD = /^U\d{1,2}$/;
const MAX_TEXTO = 200;

export const csvInvalido = (motivo: string): BadRequestException =>
  new BadRequestException({ code: ApiErrorCode.CSV_INVALID, message: motivo });

/** Una fila del CSV tal como vino. `fila` cuenta la cabecera como 1. */
export interface FilaCsv {
  fila: number;
  modulo: string;
  unidad: string;
  unidadNombre: string;
  categoria: string;
  tipo: string;
  ingles: string;
  espanol: string;
}

export interface FilaAnalizada extends FilaCsv {
  estado: EstadoFilaImportacion;
  motivo: string | null;
  moduleId?: string;
  moduloNumero?: number;
  categoryId?: string;
  tipoEntrada?: TipoEntrada;
  inglesNorm?: string;
  unitId?: string | null;
  unidadNueva?: { codigo: string; nombre: string };
  existenteId?: string;
}

export interface ResultadoCarga {
  creadas: number;
  actualizadas: number;
  unidadesCreadas: number;
}

/** Lee el CSV del diccionario: con o sin BOM, separado por `,` o `;` (Excel en español). */
export function leerCsvDiccionario(texto: string): FilaCsv[] {
  const limpio = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const primeraLinea = limpio.split(/\r?\n/, 1)[0] ?? '';
  const separador = contar(primeraLinea, ';') > contar(primeraLinea, ',') ? ';' : ',';
  const [cabecera, ...filas] = filasCsv(limpio, separador);
  if (!cabecera) throw csvInvalido('El archivo está vacío.');

  const columnas = cabecera.map((c) => normalizarTexto(c).replace(/[\s-]+/g, '_'));
  const faltan = OBLIGATORIAS.filter((c) => !columnas.includes(c));
  if (faltan.length > 0) {
    throw csvInvalido(`Faltan columnas en la cabecera: ${faltan.join(', ')}.`);
  }
  const celda = (fila: string[], nombre: string) => (fila[columnas.indexOf(nombre)] ?? '').trim();

  return filas.map((f, i) => ({
    fila: i + 2,
    modulo: celda(f, 'modulo'),
    unidad: celda(f, 'unidad'),
    unidadNombre: celda(f, 'unidad_nombre'),
    categoria: celda(f, 'categoria'),
    tipo: celda(f, 'tipo'),
    ingles: celda(f, 'ingles'),
    espanol: celda(f, 'espanol'),
  }));
}

export function resumir(filas: readonly FilaAnalizada[]): ResumenImportacion {
  const unidades = new Map<string, { modulo: number; codigo: string; nombre: string }>();
  for (const f of filas) {
    if (f.estado !== 'error' && f.unidadNueva && f.moduloNumero !== undefined) {
      unidades.set(`${f.moduloNumero}|${f.unidadNueva.codigo}`, {
        modulo: f.moduloNumero,
        ...f.unidadNueva,
      });
    }
  }
  return {
    total: filas.length,
    nuevas: filas.filter((f) => f.estado === 'nueva').length,
    duplicadas: filas.filter((f) => f.estado === 'duplicada').length,
    errores: filas.filter((f) => f.estado === 'error').length,
    unidadesNuevas: [...unidades.values()],
  };
}

export function toFilaImportacion(f: FilaAnalizada): FilaImportacion {
  return {
    fila: f.fila,
    estado: f.estado,
    motivo: f.motivo,
    modulo: f.modulo,
    unidad: f.unidad,
    categoria: f.categoria,
    tipo: f.tipo,
    ingles: f.ingles,
    espanol: f.espanol,
    unidadNueva: f.estado !== 'error' && !!f.unidadNueva,
  };
}

/**
 * Único camino de carga de entradas: lo usan el seed y la importación CSV. Resuelve módulo,
 * unidad y categoría por número/código o nombre, y detecta duplicadas por (módulo, inglés, tipo).
 */
@Injectable()
export class CargaEntradasService {
  /** No escribe nada. */
  async analizar(db: Db, filas: readonly FilaCsv[]): Promise<FilaAnalizada[]> {
    const [modulos, unidades, categorias, existentes] = await Promise.all([
      db.dictionaryModule.findMany(),
      db.dictionaryUnit.findMany(),
      db.dictionaryCategory.findMany({ where: { deletedAt: null } }),
      db.dictionaryEntry.findMany({
        where: { deletedAt: null },
        select: { id: true, moduleId: true, inglesNorm: true, tipo: true },
      }),
    ]);

    const moduloPor = new Map<string, (typeof modulos)[number]>();
    for (const m of modulos) {
      moduloPor.set(String(m.numero), m);
      moduloPor.set(normalizarTexto(m.nombre), m);
    }
    const unidadPor = new Map<string, (typeof unidades)[number]>();
    for (const u of unidades) {
      unidadPor.set(`${u.moduleId}|${u.codigo.toUpperCase()}`, u);
      if (!u.deletedAt) unidadPor.set(`${u.moduleId}|${normalizarTexto(u.nombre)}`, u);
    }
    const categoriaPor = new Map<string, string>();
    for (const c of categorias) {
      categoriaPor.set(normalizarTexto(c.nombre), c.id);
      categoriaPor.set(c.slug, c.id);
    }
    const existentePor = new Map(
      existentes.map((e) => [`${e.moduleId}|${e.inglesNorm}|${e.tipo}`, e.id]),
    );
    const vistas = new Map<string, number>();

    return filas.map((f): FilaAnalizada => {
      const error = (motivo: string): FilaAnalizada => ({ ...f, estado: 'error', motivo });

      if (!f.ingles) return error('Falta el inglés.');
      if (!f.espanol) return error('Falta el español.');
      if (f.ingles.length > MAX_TEXTO || f.espanol.length > MAX_TEXTO) {
        return error(`El texto no puede pasar de ${MAX_TEXTO} caracteres.`);
      }
      const modulo = moduloPor.get(normalizarTexto(f.modulo));
      if (!modulo) return error(`El módulo “${f.modulo}” no existe.`);
      const tipo = tipoDesdeEtiqueta(f.tipo);
      if (!tipo) return error('El tipo debe ser Palabra, Verbo, Frase o Expresión.');
      const categoryId =
        categoriaPor.get(normalizarTexto(f.categoria)) ?? categoriaPor.get(f.categoria);
      if (!categoryId) return error(`La categoría “${f.categoria}” no existe.`);

      let unitId: string | null = null;
      let unidadNueva: FilaAnalizada['unidadNueva'];
      if (f.unidad) {
        const codigo = f.unidad.toUpperCase();
        const unidad =
          unidadPor.get(`${modulo.id}|${codigo}`) ??
          unidadPor.get(`${modulo.id}|${normalizarTexto(f.unidad)}`);
        if (unidad?.deletedAt)
          return error(`La unidad “${f.unidad}” fue eliminada. Usa otra unidad.`);
        if (unidad) {
          unitId = unidad.id;
        } else if (!CODIGO_UNIDAD.test(codigo)) {
          return error(`La unidad “${f.unidad}” no existe en el Módulo ${modulo.numero}.`);
        } else if (!f.unidadNombre) {
          return error(
            `La unidad “${f.unidad}” no existe en el Módulo ${modulo.numero}. Escribe su nombre en la columna unidad_nombre para crearla.`,
          );
        } else {
          unidadNueva = { codigo, nombre: f.unidadNombre };
        }
      }

      const inglesNorm = normalizarTexto(f.ingles);
      const clave = `${modulo.id}|${inglesNorm}|${tipo}`;
      const repetida = vistas.get(clave);
      if (repetida !== undefined) return error(`Repite la fila ${repetida}.`);
      vistas.set(clave, f.fila);

      const existenteId = existentePor.get(clave);
      return {
        ...f,
        estado: existenteId ? 'duplicada' : 'nueva',
        motivo: existenteId ? `Ya existe en el Módulo ${modulo.numero}.` : null,
        moduleId: modulo.id,
        moduloNumero: modulo.numero,
        categoryId,
        tipoEntrada: tipo,
        inglesNorm,
        unitId,
        unidadNueva,
        existenteId,
      };
    });
  }

  /** Escribe las nuevas (y las duplicadas si se pide). Llamar dentro de una transacción. */
  async aplicar(
    tx: Db,
    filas: readonly FilaAnalizada[],
    incluirDuplicadas: boolean,
  ): Promise<ResultadoCarga> {
    const aplicables = filas.filter(
      (f) => f.estado === 'nueva' || (incluirDuplicadas && f.estado === 'duplicada'),
    );
    const resultado: ResultadoCarga = { creadas: 0, actualizadas: 0, unidadesCreadas: 0 };
    if (aplicables.length === 0) return resultado;

    const unidadesCreadas = new Map<string, string>();
    for (const f of aplicables) {
      if (!f.unidadNueva || !f.moduleId) continue;
      const clave = `${f.moduleId}|${f.unidadNueva.codigo}`;
      if (!unidadesCreadas.has(clave)) {
        const { _max } = await tx.dictionaryUnit.aggregate({
          where: { moduleId: f.moduleId, deletedAt: null },
          _max: { orden: true },
        });
        const unidad = await tx.dictionaryUnit.create({
          data: {
            moduleId: f.moduleId,
            codigo: f.unidadNueva.codigo,
            nombre: f.unidadNueva.nombre,
            orden: (_max.orden ?? 0) + 1,
          },
        });
        unidadesCreadas.set(clave, unidad.id);
      }
    }
    resultado.unidadesCreadas = unidadesCreadas.size;

    const slugs = new Set(
      (await tx.dictionaryEntry.findMany({ select: { slug: true } })).map((e) => e.slug),
    );
    const ordenPor = new Map<string, number>();
    const siguienteOrden = async (moduleId: string, categoryId: string) => {
      const clave = `${moduleId}|${categoryId}`;
      let actual = ordenPor.get(clave);
      if (actual === undefined) {
        const { _max } = await tx.dictionaryEntry.aggregate({
          where: { moduleId, categoryId },
          _max: { orden: true },
        });
        actual = _max.orden ?? 0;
      }
      ordenPor.set(clave, actual + 1);
      return actual + 1;
    };

    for (const f of aplicables) {
      const moduleId = f.moduleId as string;
      const categoryId = f.categoryId as string;
      const unitId = f.unidadNueva
        ? (unidadesCreadas.get(`${moduleId}|${f.unidadNueva.codigo}`) as string)
        : (f.unitId ?? null);
      const datos = {
        ingles: f.ingles,
        espanol: f.espanol,
        espanolNorm: normalizarTexto(f.espanol),
        unitId,
        categoryId,
      };

      if (f.estado === 'duplicada' && f.existenteId) {
        const actual = await tx.dictionaryEntry.findUniqueOrThrow({ where: { id: f.existenteId } });
        await tx.dictionaryEntry.update({
          where: { id: f.existenteId },
          data: {
            ...datos,
            ...(actual.categoryId !== categoryId && {
              orden: await siguienteOrden(moduleId, categoryId),
            }),
          },
        });
        resultado.actualizadas++;
        continue;
      }

      const slug = slugUnico(slugBase(f.ingles), slugs);
      slugs.add(slug);
      await tx.dictionaryEntry.create({
        data: {
          ...datos,
          slug,
          inglesNorm: f.inglesNorm as string,
          tipo: f.tipoEntrada as TipoEntrada,
          moduleId,
          orden: await siguienteOrden(moduleId, categoryId),
        },
      });
      resultado.creadas++;
    }

    return resultado;
  }
}

function contar(texto: string, caracter: string): number {
  return texto.split(caracter).length - 1;
}
