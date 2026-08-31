import type {
  HistorialEstudianteResponse,
  HistorialProfesorResponse,
  HistorialQuery,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /historial` (HU-404). La forma de la respuesta depende del rol
 * de quien pregunta, y ese alcance lo decide el servidor a partir del token:
 * esta función no manda ningún id de estudiante o profesor.
 */
export function getHistorial(
  query: HistorialQuery,
): Promise<HistorialEstudianteResponse | HistorialProfesorResponse> {
  return httpClient.get<HistorialEstudianteResponse | HistorialProfesorResponse>('/historial', {
    params: query,
  });
}
