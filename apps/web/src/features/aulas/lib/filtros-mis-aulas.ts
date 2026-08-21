import {
  ESTADO_TEMPORAL_POR_DEFECTO,
  EstadoTemporalAula,
  type MisAulasQuery,
} from '@academia/types';

/**
 * Traducción entre el filtro de «Mis aulas» y la URL (HU-207, AC6): copiar el
 * enlace y abrirlo en otra pestaña tiene que reproducir la misma vista.
 *
 * Puro y sin DOM, igual que `filtros-url.ts` del catálogo: recibe y devuelve
 * `URLSearchParams`, no lee `window.location`. Es un archivo aparte y no una
 * rama del otro porque los dos listados **no comparten filtros** —el catálogo
 * filtra por nivel y fecha para descubrir; este, por estado temporal para
 * gestionar— y fundirlos obligaría a que cada función supiera en qué pantalla
 * está.
 */

/**
 * Lee el filtro desde la URL. Un valor que no existe se IGNORA y cae en el
 * valor por defecto: la URL es un contrato con quien la comparte, no con el
 * tipo, y alguien puede teclearla a mano o pegar un enlace viejo.
 */
export function parseMisAulasQuery(searchParams: URLSearchParams): MisAulasQuery {
  const query: MisAulasQuery = {};

  const estado = searchParams.get('estado');
  if (estado && esEstadoValido(estado)) {
    query.estado = estado;
  }

  const page = enteroPositivo(searchParams.get('page'));
  if (page) query.page = page;

  const pageSize = enteroPositivo(searchParams.get('pageSize'));
  if (pageSize) query.pageSize = pageSize;

  return query;
}

/** El inverso: del filtro activo a los params que van en la URL. */
export function buildMisAulasSearchParams(query: MisAulasQuery): URLSearchParams {
  const params = new URLSearchParams();

  // `todas` y la página 1 son los valores por defecto: omitirlos deja la URL
  // limpia sin cambiar ni una fila de lo que se ve, que es lo que el AC6 pide.
  if (query.estado && query.estado !== ESTADO_TEMPORAL_POR_DEFECTO) {
    params.set('estado', query.estado);
  }
  if (query.page && query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  return params;
}

/** El filtro activo, ya resuelto: lo que el selector tiene que mostrar marcado. */
export function estadoActivo(query: MisAulasQuery): EstadoTemporalAula {
  return query.estado ?? ESTADO_TEMPORAL_POR_DEFECTO;
}

function esEstadoValido(value: string): value is EstadoTemporalAula {
  return (Object.values(EstadoTemporalAula) as string[]).includes(value);
}

function enteroPositivo(value: string | null): number | undefined {
  if (!value) return undefined;
  const numero = Number(value);
  return Number.isInteger(numero) && numero >= 1 ? numero : undefined;
}
