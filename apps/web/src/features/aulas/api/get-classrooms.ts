import type { ListClassroomsQuery, ListClassroomsResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /classrooms` con los filtros y la página pedidos.
 *
 * Los filtros son responsabilidad del servidor (nivel, rango de fechas,
 * paginación): esta función solo los traslada a query params, axios omite
 * las claves `undefined` por su cuenta.
 */
export function getClassrooms(query: ListClassroomsQuery): Promise<ListClassroomsResponse> {
  return httpClient.get<ListClassroomsResponse>('/classrooms', { params: query });
}
