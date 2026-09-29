import type { MetricasQuery } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getMetricas } from '../api/get-metricas';

export function useMetricas(query: MetricasQuery) {
  return useQuery({
    queryKey: ['admin', 'metricas', query],
    queryFn: () => getMetricas(query),
    placeholderData: keepPreviousData,
  });
}
