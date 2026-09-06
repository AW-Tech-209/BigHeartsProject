import type { ResumenPanelResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /panel/resumen` (HU-502). No manda ningún parámetro: la forma y
 * el alcance salen del token (`ARQUITECTURA.md` §4.8), igual que `getHistorial`.
 */
export function getResumenPanel(): Promise<ResumenPanelResponse> {
  return httpClient.get<ResumenPanelResponse>('/panel/resumen');
}
