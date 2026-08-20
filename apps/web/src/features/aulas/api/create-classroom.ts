import type { CreateClassroomInput, CreateClassroomResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /classrooms`. Devuelve el aula ya publicada. */
export function createClassroom(input: CreateClassroomInput): Promise<CreateClassroomResponse> {
  return httpClient.post<CreateClassroomResponse>('/classrooms', input);
}
