import { type AdminUsuariosQuery, UserRole, UserStatus } from '@academia/types';

const ROLES: string[] = Object.values(UserRole);
const ESTADOS: string[] = Object.values(UserStatus);

/** Un valor sin sentido en la URL se ignora, no rompe la pantalla. */
export function parseAdminUsuariosQuery(params: URLSearchParams): AdminUsuariosQuery {
  const query: AdminUsuariosQuery = {};

  const rol = params.get('rol');
  if (rol && ROLES.includes(rol)) query.rol = rol as UserRole;

  const estado = params.get('estado');
  if (estado && ESTADOS.includes(estado)) query.estado = estado as UserStatus;

  const q = params.get('q')?.trim();
  if (q) query.q = q;

  const page = Number(params.get('page'));
  if (Number.isInteger(page) && page > 1) query.page = page;

  return query;
}

export function buildAdminUsuariosSearchParams(query: AdminUsuariosQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.rol) params.set('rol', query.rol);
  if (query.estado) params.set('estado', query.estado);
  if (query.q) params.set('q', query.q);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  return params;
}

export function hayFiltrosDeUsuarios(query: AdminUsuariosQuery): boolean {
  return Boolean(query.rol || query.estado || query.q);
}
