import type { ClassroomDetailResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /classrooms/:id` y devuelve el detalle del aula (HU-204).
 *
 * **El `meetingLink` puede venir o no venir, y quien decide es el servidor**
 * (`ARQUITECTURA.md` §4.1). Aquí no hay ninguna comprobación de permiso, y no
 * es un olvido: replicarla convertiría una decisión del servidor en una
 * apariencia del cliente, que es exactamente lo que §4.1 prohíbe. La pantalla
 * pinta el enlace si llegó, y no lo pinta si no llegó.
 */
export function getClassroom(id: string): Promise<ClassroomDetailResponse> {
  return httpClient.get<ClassroomDetailResponse>(`/classrooms/${id}`);
}
