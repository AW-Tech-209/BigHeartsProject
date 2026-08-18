import type { ProfileResponse, UpdateProfileInput } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `PATCH /users/me`.
 *
 * El cuerpo es `UpdateProfileInput`, que solo admite los campos editables. No
 * mandes `email`, `role` ni `id`: el ValidationPipe del backend rechaza la
 * petición entera con `VALIDATION_ERROR` si aparecen.
 */
export function updateProfile(input: UpdateProfileInput): Promise<ProfileResponse> {
  return httpClient.patch<ProfileResponse>('/users/me', input);
}
