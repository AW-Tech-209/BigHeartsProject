import type { AdminClassroomsQuery, AdminClassroomsResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /admin/classrooms` (HU-210): la supervisión completa, de todos
 * los profesores. Endpoint propio y no un `?todas=true` del catálogo —
 * decisión 1 de la HU—, así que vive en su propio módulo de la API.
 */
export function getAdminClassrooms(query: AdminClassroomsQuery): Promise<AdminClassroomsResponse> {
  return httpClient.get<AdminClassroomsResponse>('/admin/classrooms', { params: query });
}
