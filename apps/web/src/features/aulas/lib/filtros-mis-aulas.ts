import type { MisAulasQuery } from '@academia/types';

/**
 * Traducción entre la página de «Mis aulas»/«Mis clases» y la URL (HU-207,
 * AC6): copiar el enlace y abrirlo en otra pestaña tiene que reproducir la
 * misma vista.
 *
 * Desde HU-404 (D34) estas pantallas solo muestran lo próximo: el filtro de
 * estado temporal se mudó al historial, así que aquí solo queda la página.
 */

/** Lee la página desde la URL. Un valor inválido se IGNORA y cae en la página 1. */
export function parseMisAulasQuery(searchParams: URLSearchParams): MisAulasQuery {
  const query: MisAulasQuery = {};

  const page = enteroPositivo(searchParams.get('page'));
  if (page) query.page = page;

  const pageSize = enteroPositivo(searchParams.get('pageSize'));
  if (pageSize) query.pageSize = pageSize;

  return query;
}

/** El inverso: de la página activa a los params que van en la URL. */
export function buildMisAulasSearchParams(query: MisAulasQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.page && query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  return params;
}

function enteroPositivo(value: string | null): number | undefined {
  if (!value) return undefined;
  const numero = Number(value);
  return Number.isInteger(numero) && numero >= 1 ? numero : undefined;
}
