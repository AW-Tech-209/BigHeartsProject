import { type AdminClassroomsQuery, ClassroomStatus } from '@academia/types';

/**
 * Traducción entre los filtros de supervisión y la URL (AC5): copiar el
 * enlace y abrirlo en otra pestaña tiene que reproducir la misma vista. Mismo
 * patrón que `filtros-url.ts` del catálogo.
 */

/**
 * Lee los filtros desde la URL. Un valor que no tiene sentido se IGNORA, no
 * rompe la pantalla: la URL es un contrato con quien la comparte, no con el
 * tipo — alguien puede teclearla a mano o pegar un enlace viejo.
 */
export function parseAdminClassroomsQuery(searchParams: URLSearchParams): AdminClassroomsQuery {
  const query: AdminClassroomsQuery = {};

  const teacherId = searchParams.get('teacherId');
  if (teacherId) query.teacherId = teacherId;

  const status = searchParams.get('status');
  if (status && esEstadoValido(status)) query.status = status;

  const desde = searchParams.get('desde');
  if (desde) query.desde = desde;

  const hasta = searchParams.get('hasta');
  if (hasta) query.hasta = hasta;

  const page = enteroPositivo(searchParams.get('page'));
  if (page) query.page = page;

  return query;
}

/** El inverso: de los filtros activos a los params que van en la URL. */
export function buildAdminClassroomsSearchParams(query: AdminClassroomsQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.teacherId) params.set('teacherId', query.teacherId);
  if (query.status) params.set('status', query.status);
  if (query.desde) params.set('desde', query.desde);
  if (query.hasta) params.set('hasta', query.hasta);
  // La página 1 es el default: omitirla mantiene la URL limpia.
  if (query.page && query.page !== 1) params.set('page', String(query.page));

  return params;
}

/** ¿Hay algún filtro de contenido activo? (la página no cuenta como filtro). */
export function hayFiltrosActivos(query: AdminClassroomsQuery): boolean {
  return Boolean(query.teacherId || query.status || query.desde || query.hasta);
}

/**
 * Solo `PUBLISHED` y `CANCELLED` son valores reales que puede tener un aula
 * en Fase 1 (D15: nace `PUBLISHED`; D16: `COMPLETED` no tiene escritor;
 * `DRAFT` no tiene flujo de publicación). Un `?status=` con otro valor se
 * ignora, igual que una fecha con forma inválida.
 */
function esEstadoValido(value: string): value is ClassroomStatus {
  return value === ClassroomStatus.PUBLISHED || value === ClassroomStatus.CANCELLED;
}

function enteroPositivo(value: string | null): number | undefined {
  if (!value) return undefined;
  const numero = Number(value);
  return Number.isInteger(numero) && numero >= 1 ? numero : undefined;
}
