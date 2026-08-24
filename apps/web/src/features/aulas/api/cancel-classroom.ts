import type { CancelClassroomResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /classrooms/:id/cancel` (HU-202). Devuelve el aula ya cancelada. */
export function cancelClassroom(id: string): Promise<CancelClassroomResponse> {
  return httpClient.post<CancelClassroomResponse>(`/classrooms/${id}/cancel`);
}
