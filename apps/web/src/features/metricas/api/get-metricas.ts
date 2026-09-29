import type { MetricasAcademia, MetricasQuery } from '@academia/types';

import { httpClient } from '@/lib/http-client';

export function getMetricas(params: MetricasQuery): Promise<MetricasAcademia> {
  return httpClient.get<MetricasAcademia>('/admin/metricas', { params });
}
