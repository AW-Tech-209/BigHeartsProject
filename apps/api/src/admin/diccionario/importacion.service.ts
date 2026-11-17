import { randomUUID } from 'node:crypto';

import { GoneException, Injectable } from '@nestjs/common';
import {
  ApiErrorCode,
  type ConfirmarImportacionResponse,
  IMPORTACION_MAX_BYTES,
  PLANTILLA_IMPORTACION_CSV,
  type VistaPreviaImportacionResponse,
} from '@academia/types';

import {
  CargaEntradasService,
  csvInvalido,
  leerCsvDiccionario,
  resumir,
  toFilaImportacion,
} from '../../diccionario/carga-entradas.service';
import { archivoDemasiadoGrande } from '../../diccionario/diccionario.errors';
import { PrismaService } from '../../prisma/prisma.service';

export const VISTA_PREVIA_TTL_MS = 30 * 60 * 1000;

export const PLANTILLA_CSV = PLANTILLA_IMPORTACION_CSV;

const vistaPreviaCaducada = (): GoneException =>
  new GoneException({
    code: ApiErrorCode.IMPORT_PREVIEW_EXPIRED,
    message: 'La vista previa caducó. Vuelve a subir el archivo.',
  });

/**
 * Importación en dos pasos: la vista previa no escribe nada y guarda el CSV 30 min en memoria;
 * confirmar lo vuelve a analizar dentro de la transacción, por si la base cambió entretanto.
 */
@Injectable()
export class ImportacionService {
  private readonly vistas = new Map<string, { csv: string; expira: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly carga: CargaEntradasService,
  ) {}

  async vistaPrevia(archivo: Buffer, ahora = new Date()): Promise<VistaPreviaImportacionResponse> {
    if (archivo.length > IMPORTACION_MAX_BYTES) throw archivoDemasiadoGrande(IMPORTACION_MAX_BYTES);
    let csv: string;
    try {
      csv = new TextDecoder('utf-8', { fatal: true }).decode(archivo);
    } catch {
      throw csvInvalido('El archivo no está en UTF-8. En Excel: Guardar como → «CSV UTF-8».');
    }

    const filas = await this.carga.analizar(this.prisma, leerCsvDiccionario(csv));
    this.limpiarCaducadas(ahora);
    const token = randomUUID();
    const expira = ahora.getTime() + VISTA_PREVIA_TTL_MS;
    this.vistas.set(token, { csv, expira });

    return {
      token,
      expiraEl: new Date(expira).toISOString(),
      filas: filas.map(toFilaImportacion),
      resumen: resumir(filas),
    };
  }

  /** Todo o nada. Un módulo PROXIMAMENTE sigue así: publicarlo es decisión de Estructura. */
  async confirmar(
    token: string,
    incluirDuplicadas: boolean,
    ahora = new Date(),
  ): Promise<ConfirmarImportacionResponse> {
    const vista = this.vistas.get(token);
    if (!vista || vista.expira <= ahora.getTime()) {
      this.vistas.delete(token);
      throw vistaPreviaCaducada();
    }

    const resultado = await this.prisma.$transaction(
      async (tx) => {
        const filas = await this.carga.analizar(tx, leerCsvDiccionario(vista.csv));
        return this.carga.aplicar(tx, filas, incluirDuplicadas);
      },
      { timeout: 120_000 },
    );
    this.vistas.delete(token);
    return resultado;
  }

  private limpiarCaducadas(ahora: Date): void {
    for (const [token, vista] of this.vistas) {
      if (vista.expira <= ahora.getTime()) this.vistas.delete(token);
    }
  }
}
