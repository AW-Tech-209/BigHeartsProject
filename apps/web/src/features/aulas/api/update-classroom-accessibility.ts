import type {
  UpdateClassroomAccessibilityInput,
  UpdateClassroomAccessibilityResponse,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `PATCH /classrooms/:id` (HU-211). Devuelve el aula ya actualizada. */
export function updateClassroomAccessibility(
  id: string,
  input: UpdateClassroomAccessibilityInput,
): Promise<UpdateClassroomAccessibilityResponse> {
  return httpClient.patch<UpdateClassroomAccessibilityResponse>(`/classrooms/${id}`, input);
}
