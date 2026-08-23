import { CommunicationPreference, EnglishLevel, type ListClassroomsQuery } from '@academia/types';

/**
 * Traducción entre los filtros del catálogo y la URL (AC4): copiar el enlace
 * y abrirlo en otra pestaña tiene que reproducir la misma vista.
 *
 * Puro y sin DOM a propósito: recibe/devuelve `URLSearchParams`, no lee
 * `window.location`. Quien lo llama (la página) es quien decide de dónde
 * vienen esos params —`useSearchParams()` en producción, uno construido a
 * mano en un test.
 */

/**
 * Lee los filtros desde la URL. Un valor que no tiene sentido (un nivel que
 * no existe, una página no numérica) se IGNORA, no rompe la pantalla: la URL
 * es un contrato con quien la comparte, no con el tipo — alguien puede
 * teclearla a mano o pegar un enlace viejo.
 */
export function parseListClassroomsQuery(searchParams: URLSearchParams): ListClassroomsQuery {
  const query: ListClassroomsQuery = {};

  const level = searchParams.get('level');
  if (level && esNivelValido(level)) {
    query.level = level;
  }

  const communicationMode = searchParams.get('communicationMode');
  if (communicationMode && esModoValido(communicationMode)) {
    query.communicationMode = communicationMode;
  }

  // AC6: el filtro del profesor viaja en la URL como los demás. Solo `true` lo
  // enciende — cualquier otro valor (`1`, `si`, vacío) se ignora, igual que un
  // nivel inexistente: la URL la puede teclear alguien a mano.
  if (searchParams.get('mias') === 'true') {
    query.mias = true;
  }

  const desde = searchParams.get('desde');
  if (desde) query.desde = desde;

  const hasta = searchParams.get('hasta');
  if (hasta) query.hasta = hasta;

  const page = enteroPositivo(searchParams.get('page'));
  if (page) query.page = page;

  const pageSize = enteroPositivo(searchParams.get('pageSize'));
  if (pageSize) query.pageSize = pageSize;

  return query;
}

/** El inverso: de los filtros activos a los params que van en la URL. */
export function buildSearchParams(query: ListClassroomsQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.level) params.set('level', query.level);
  if (query.communicationMode) params.set('communicationMode', query.communicationMode);
  // Apagado es el default: `?mias=false` no aporta nada y ensucia el enlace que
  // el profesor comparte. Mismo criterio que `page=1`.
  if (query.mias) params.set('mias', 'true');
  if (query.desde) params.set('desde', query.desde);
  if (query.hasta) params.set('hasta', query.hasta);
  // La página 1 es el default: omitirla mantiene la URL limpia cuando no
  // hace falta compartir "en qué página estabas", solo qué filtros aplicaste.
  if (query.page && query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  return params;
}

/**
 * ¿Hay algún filtro de contenido activo? (la página no cuenta como filtro).
 *
 * `mias` cuenta: es un filtro de contenido como cualquier otro, y `Quitar
 * filtros` tiene que devolver al profesor el catálogo completo, no dejarle la
 * mitad puesta. Que además cambie el TEXTO del vacío lo decide la página, que
 * mira `mias` antes que esto (AC7).
 */
export function hayFiltrosActivos(query: ListClassroomsQuery): boolean {
  return Boolean(
    query.level || query.communicationMode || query.desde || query.hasta || query.mias,
  );
}

function esNivelValido(value: string): value is EnglishLevel {
  return (Object.values(EnglishLevel) as string[]).includes(value);
}

function esModoValido(value: string): value is CommunicationPreference {
  return (Object.values(CommunicationPreference) as string[]).includes(value);
}

function enteroPositivo(value: string | null): number | undefined {
  if (!value) return undefined;
  const numero = Number(value);
  return Number.isInteger(numero) && numero >= 1 ? numero : undefined;
}
