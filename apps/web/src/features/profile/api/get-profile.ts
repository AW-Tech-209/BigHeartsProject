import type { ProfileResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `GET /users/me`.
 *
 * No recibe id a propósito: el backend lo saca del access token. El frontend no
 * tiene forma de pedir el perfil de otra persona, y así debe seguir.
 */
export function getProfile(): Promise<ProfileResponse> {
  return httpClient.get<ProfileResponse>('/users/me');
}
