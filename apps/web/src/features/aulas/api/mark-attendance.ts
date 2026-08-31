import type { MarkAttendanceInput, MarkAttendanceResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /classrooms/:id/asistencia` (HU-403). Solo el profesor dueño. */
export function markAttendance(
  classroomId: string,
  input: MarkAttendanceInput,
): Promise<MarkAttendanceResponse> {
  return httpClient.post<MarkAttendanceResponse>(`/classrooms/${classroomId}/asistencia`, input);
}
