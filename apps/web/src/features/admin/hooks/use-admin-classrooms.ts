import type { AdminClassroomsQuery } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getAdminClassrooms } from '../api/get-admin-classrooms';

/** Clave de la query de supervisión, parametrizada por el filtro activo. */
export const adminClassroomsQueryKey = (query: AdminClassroomsQuery) =>
  ['admin', 'classrooms', query] as const;

/**
 * Lee la supervisión completa desde `GET /admin/classrooms`.
 *
 * `placeholderData: keepPreviousData` evita el parpadeo de "cargando" al
 * cambiar de filtro o de página: mismo criterio que `useMisAulas`.
 */
export function useAdminClassrooms(query: AdminClassroomsQuery) {
  return useQuery({
    queryKey: adminClassroomsQueryKey(query),
    queryFn: () => getAdminClassrooms(query),
    placeholderData: keepPreviousData,
  });
}
