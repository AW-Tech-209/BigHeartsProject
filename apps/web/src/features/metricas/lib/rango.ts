import type { MetricasQuery } from '@academia/types';

export const DIAS_PRESET = [7, 30, 90] as const;
export type RangoUrl = { dias: number } | { desde: string; hasta: string };

const DIAS_POR_DEFECTO = 30;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` con la fecha local del navegador (no UTC: «hoy» es el de quien mira). */
export function aFechaLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function leerRango(params: URLSearchParams): RangoUrl {
  const desde = params.get('desde');
  const hasta = params.get('hasta');
  if (desde && hasta && FECHA.test(desde) && FECHA.test(hasta) && desde <= hasta) {
    return { desde, hasta };
  }
  const dias = Number(params.get('dias'));
  return { dias: (DIAS_PRESET as readonly number[]).includes(dias) ? dias : DIAS_POR_DEFECTO };
}

export function rangoAParams(rango: RangoUrl): URLSearchParams {
  return 'dias' in rango
    ? new URLSearchParams({ dias: String(rango.dias) })
    : new URLSearchParams({ desde: rango.desde, hasta: rango.hasta });
}

/** Los «últimos N días» incluyen hoy: N = 7 va de hace 6 días a hoy. */
export function rangoAQuery(rango: RangoUrl, hoy: Date = new Date()): Required<MetricasQuery> {
  if (!('dias' in rango)) return rango;
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - (rango.dias - 1));
  return { desde: aFechaLocal(inicio), hasta: aFechaLocal(hoy) };
}
