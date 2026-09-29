import { BadRequestException } from '@nestjs/common';
import { AGENDA_RANGO_MAX_DIAS, ApiErrorCode } from '@academia/types';

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * El rango `[desde, hasta)` de una consulta de calendario, o `null` si no se pidió.
 * Un solo extremo, un rango invertido o uno mayor de 42 días es un 400.
 */
export function leerRangoAgenda(query: {
  desde?: string;
  hasta?: string;
}): { desde: Date; hasta: Date } | null {
  if (query.desde === undefined && query.hasta === undefined) return null;

  const fallo = (message: string) =>
    new BadRequestException({
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Los datos enviados no son válidos.',
      fields: [{ field: 'desde', message }],
    });

  if (query.desde === undefined || query.hasta === undefined) {
    throw fallo('«desde» y «hasta» se envían juntos.');
  }

  const desde = new Date(query.desde);
  const hasta = new Date(query.hasta);
  if (hasta <= desde) throw fallo('«hasta» debe ser posterior a «desde».');
  if (hasta.getTime() - desde.getTime() > AGENDA_RANGO_MAX_DIAS * DIA_MS) {
    throw fallo(`El rango no puede superar ${AGENDA_RANGO_MAX_DIAS} días.`);
  }
  return { desde, hasta };
}
