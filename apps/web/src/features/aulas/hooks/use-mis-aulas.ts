import type { MisAulasQuery } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getMisAulas } from '../api/get-mis-aulas';

/** Clave de la query de «Mis aulas», parametrizada por el filtro activo. */
export const misAulasQueryKey = (query: MisAulasQuery) => ['aulas', 'mias', query] as const;

/**
 * Lee las aulas del profesor autenticado desde `GET /classrooms/mias`.
 *
 * Clave distinta a la del catálogo (`['aulas', 'listado', …]`) a propósito: son
 * dos vistas con distinto alcance, y compartir caché haría que una respuesta
 * pública sirviera de respuesta privada.
 *
 * `placeholderData: keepPreviousData` evita el parpadeo de "cargando" al
 * cambiar de filtro o de página: mientras llega la respuesta nueva se sigue
 * mostrando la anterior REAL, nunca un dato inventado.
 */
export function useMisAulas(query: MisAulasQuery) {
  return useQuery({
    queryKey: misAulasQueryKey(query),
    queryFn: () => getMisAulas(query),
    placeholderData: keepPreviousData,
  });
}
