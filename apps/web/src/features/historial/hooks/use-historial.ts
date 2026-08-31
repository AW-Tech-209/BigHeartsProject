import type { HistorialQuery } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getHistorial } from '../api/get-historial';

export const historialQueryKey = (query: HistorialQuery) => ['historial', query] as const;

/**
 * Lee el historial de quien está autenticado desde `GET /historial`.
 *
 * `placeholderData: keepPreviousData`, mismo criterio que `useMisAulas`: al
 * cambiar de página se sigue mostrando la respuesta anterior real mientras
 * llega la nueva, nunca un dato inventado.
 */
export function useHistorial(query: HistorialQuery) {
  return useQuery({
    queryKey: historialQueryKey(query),
    queryFn: () => getHistorial(query),
    placeholderData: keepPreviousData,
  });
}
