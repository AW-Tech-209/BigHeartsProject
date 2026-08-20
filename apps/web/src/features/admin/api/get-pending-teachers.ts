import type { PendingTeachersResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /admin/teachers/pending`.
 *
 * No lleva filtros: quién sale en esa lista lo decide el servidor (solo
 * `TEACHER` + `PENDING`, ordenados por antigüedad). Un filtro por query aquí
 * sería una segunda fuente de verdad de una regla que ya está en un sitio.
 */
export function getPendingTeachers(): Promise<PendingTeachersResponse> {
  return httpClient.get<PendingTeachersResponse>('/admin/teachers/pending');
}
