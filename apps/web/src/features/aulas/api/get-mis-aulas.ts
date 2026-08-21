import type { MisAulasQuery, MisAulasResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /classrooms/mias` con el filtro temporal y la página pedidos.
 *
 * **No manda ningún identificador de profesor, y no es un olvido:** el alcance
 * lo decide el servidor a partir del token (`ARQUITECTURA.md` §4.8, regla 3).
 * Si algún día alguien añade aquí un `teacherId`, el backend lo rechazará —y
 * hará bien.
 */
export function getMisAulas(query: MisAulasQuery): Promise<MisAulasResponse> {
  return httpClient.get<MisAulasResponse>('/classrooms/mias', { params: query });
}
