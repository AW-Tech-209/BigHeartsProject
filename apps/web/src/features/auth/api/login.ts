import type { LoginInput, LoginResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `POST /auth/login`.
 *
 * Devuelve la sesión (`user` + `accessToken` + `expiresIn`). El refresh token
 * NO viene en el cuerpo: el backend lo planta en una cookie httpOnly que este
 * código no puede ni debe leer (ver AUTH_FLOW.md).
 */
export function login(input: LoginInput): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>('/auth/login', input);
}
