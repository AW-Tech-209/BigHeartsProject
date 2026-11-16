/**
 * Carga las entradas del diccionario desde el CSV curado (`npm run db:seed:diccionario`).
 * Módulos, unidades y categorías ya los insertó la migración. Idempotente: upsert por
 * (módulo, inglesNorm, tipo); una entrada que ya existe no se toca, ni su slug.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

import {
  normalizarTexto,
  parsearCsv,
  slugBase,
  slugUnico,
  tipoDesdeEtiqueta,
} from '../src/diccionario/diccionario.normalizar';

export const CSV_DICCIONARIO = join(__dirname, 'data', 'diccionario-m1-m3.csv');

export interface ResultadoSeedDiccionario {
  creadas: number;
  existentes: number;
}

export async function sembrarDiccionario(
  prisma: PrismaClient,
  csv: string = readFileSync(CSV_DICCIONARIO, 'utf8'),
): Promise<ResultadoSeedDiccionario> {
  const [modulos, unidades, categorias, existentes] = await Promise.all([
    prisma.dictionaryModule.findMany({ select: { id: true, numero: true } }),
    prisma.dictionaryUnit.findMany({
      where: { deletedAt: null },
      select: { id: true, moduleId: true, codigo: true },
    }),
    prisma.dictionaryCategory.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    }),
    prisma.dictionaryEntry.findMany({
      select: { slug: true, moduleId: true, inglesNorm: true, tipo: true },
    }),
  ]);

  const moduloPorNumero = new Map(modulos.map((m) => [m.numero, m.id]));
  const unidadPorClave = new Map(unidades.map((u) => [`${u.moduleId}|${u.codigo}`, u.id]));
  const categoriaPorNombre = new Map(categorias.map((c) => [normalizarTexto(c.nombre), c.id]));
  const slugs = new Set(existentes.map((e) => e.slug));
  const claves = new Set(existentes.map((e) => `${e.moduleId}|${e.inglesNorm}|${e.tipo}`));

  const resultado: ResultadoSeedDiccionario = { creadas: 0, existentes: 0 };
  const filas = parsearCsv(csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv);

  for (const [indice, [modulo, unidad, categoria, tipoTexto, ingles, espanol]] of filas.entries()) {
    const fila = indice + 2;
    const moduleId = moduloPorNumero.get(Number(modulo));
    const categoryId = categoriaPorNombre.get(normalizarTexto(categoria ?? ''));
    const tipo = tipoDesdeEtiqueta(tipoTexto ?? '');
    if (!moduleId || !categoryId || !tipo || !ingles?.trim() || !espanol?.trim()) {
      throw new Error(
        `Fila ${fila} del CSV inválida: ${[modulo, unidad, categoria, tipoTexto, ingles].join(', ')}`,
      );
    }
    const unitId = unidad?.trim() ? unidadPorClave.get(`${moduleId}|${unidad.trim()}`) : undefined;
    if (unidad?.trim() && !unitId) {
      throw new Error(`Fila ${fila}: la unidad ${unidad} no existe en el módulo ${modulo}.`);
    }

    const inglesNorm = normalizarTexto(ingles);
    const clave = `${moduleId}|${inglesNorm}|${tipo}`;
    if (claves.has(clave)) {
      resultado.existentes++;
      continue;
    }

    const slug = slugUnico(slugBase(ingles), slugs);
    await prisma.dictionaryEntry.create({
      data: {
        slug,
        ingles: ingles.trim(),
        espanol: espanol.trim(),
        inglesNorm,
        espanolNorm: normalizarTexto(espanol),
        tipo,
        moduleId,
        unitId: unitId ?? null,
        categoryId,
        orden: fila - 1,
      },
    });
    slugs.add(slug);
    claves.add(clave);
    resultado.creadas++;
  }

  return resultado;
}

if (require.main === module) {
  const prisma = new PrismaClient();
  sembrarDiccionario(prisma)
    .then(({ creadas, existentes }) => {
      console.log(`Diccionario: ${creadas} entradas nuevas, ${existentes} ya existían.`);
    })
    .catch((error: unknown) => {
      console.error(
        'Seed del diccionario fallido:',
        error instanceof Error ? error.message : error,
      );
      process.exitCode = 1;
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
