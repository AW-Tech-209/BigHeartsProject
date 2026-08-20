import type { ListClassroomsQuery } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getClassrooms } from '../api/get-classrooms';

/** Clave de la query del catálogo, parametrizada por los filtros activos. */
export const classroomsQueryKey = (query: ListClassroomsQuery) =>
  ['aulas', 'listado', query] as const;

/**
 * Lee el catálogo desde `GET /classrooms` con los filtros actuales.
 *
 * `placeholderData: keepPreviousData` evita el parpadeo de "cargando" al
 * cambiar de página o de filtro: mientras llega la respuesta nueva, se sigue
 * mostrando la página anterior REAL —no un dato inventado—, así que no
 * infringe la prohibición de mutaciones optimistas (esa regla es sobre
 * mostrar algo que el servidor no confirmó; esto es al revés, mostrar lo
 * último que sí confirmó mientras llega lo siguiente).
 */
export function useClassrooms(query: ListClassroomsQuery) {
  return useQuery({
    queryKey: classroomsQueryKey(query),
    queryFn: () => getClassrooms(query),
    placeholderData: keepPreviousData,
  });
}
