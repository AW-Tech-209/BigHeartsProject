import { useQuery } from '@tanstack/react-query';

import { getResumenPanel } from '../api/get-resumen-panel';

export const resumenPanelQueryKey = ['panel', 'resumen'] as const;

/**
 * Lee el resumen de portada de quien está autenticado desde `GET /panel/resumen`.
 * El resumen se calcula al cargar; no se refresca solo (fuera de alcance).
 */
export function useResumenPanel() {
  return useQuery({
    queryKey: resumenPanelQueryKey,
    queryFn: getResumenPanel,
  });
}
