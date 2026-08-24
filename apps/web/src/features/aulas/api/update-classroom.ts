import type { UpdateClassroomInput, UpdateClassroomResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `PATCH /classrooms/:id` (HU-202). Devuelve el aula ya actualizada. */
export function updateClassroom(
  id: string,
  input: UpdateClassroomInput,
): Promise<UpdateClassroomResponse> {
  return httpClient.patch<UpdateClassroomResponse>(`/classrooms/${id}`, input);
}
