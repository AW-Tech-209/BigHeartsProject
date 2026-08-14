import { httpClient } from '@/lib/http-client';

/**
 * Llama a `POST /auth/logout`: revoca el refresh token en la BD y borra la
 * cookie. A partir de ahí la cookie ya no sirve para renovar nada.
 *
 * No lleva cuerpo: el backend identifica la sesión por la cookie httpOnly.
 */
export function logout(): Promise<{ loggedOut: true }> {
  return httpClient.post<{ loggedOut: true }>('/auth/logout');
}
