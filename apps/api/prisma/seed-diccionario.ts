/**
 * Carga las entradas del diccionario desde el CSV curado (`npm run db:seed:diccionario`).
 * Módulos, unidades y categorías ya los insertó la migración. Usa el mismo servicio que la
 * importación CSV; una entrada que ya existe (módulo, inglés, tipo) no se toca, ni su slug.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

import {
  CargaEntradasService,
  leerCsvDiccionario,
} from '../src/diccionario/carga-entradas.service';

export const CSV_DICCIONARIO = join(__dirname, 'data', 'diccionario-m1-m3.csv');

export interface ResultadoSeedDiccionario {
  creadas: number;
  existentes: number;
}

export async function sembrarDiccionario(
  prisma: PrismaClient,
  csv: string = readFileSync(CSV_DICCIONARIO, 'utf8'),
): Promise<ResultadoSeedDiccionario> {
  const carga = new CargaEntradasService();
  const filas = await carga.analizar(prisma, leerCsvDiccionario(csv));
  const errores = filas.filter((f) => f.estado === 'error');
  if (errores.length > 0) {
    throw new Error(
      `El CSV tiene ${errores.length} filas inválidas: ${errores
        .slice(0, 5)
        .map((f) => `fila ${f.fila}: ${f.motivo}`)
        .join('; ')}`,
    );
  }

  const { creadas } = await prisma.$transaction((tx) => carga.aplicar(tx, filas, false), {
    timeout: 120_000,
  });
  return { creadas, existentes: filas.filter((f) => f.estado === 'duplicada').length };
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
