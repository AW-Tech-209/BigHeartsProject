import type { TeachersResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /admin/teachers`: todos los profesores, sin filtrar por
 * estado. Alimenta el selector del filtro de supervisión (HU-210), no un
 * listado de gestión propio.
 */
export function getTeachers(): Promise<TeachersResponse> {
  return httpClient.get<TeachersResponse>('/admin/teachers');
}
