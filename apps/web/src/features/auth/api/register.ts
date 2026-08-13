import type { RegisterInput, RegisterResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /auth/register`. Devuelve el usuario público creado. */
export function registerUser(input: RegisterInput): Promise<RegisterResponse> {
  return httpClient.post<RegisterResponse>('/auth/register', input);
}
