import type { MisReservasQuery, MisReservasResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /bookings/mias` con el filtro temporal y la página pedidos.
 *
 * **No manda ningún identificador de estudiante**: el alcance lo decide el
 * servidor a partir del token (`ARQUITECTURA.md` §4.8, regla 3), igual que
 * `getMisAulas`.
 */
export function getMisReservas(query: MisReservasQuery): Promise<MisReservasResponse> {
  return httpClient.get<MisReservasResponse>('/bookings/mias', { params: query });
}
