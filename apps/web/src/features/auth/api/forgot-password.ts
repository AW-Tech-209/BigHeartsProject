import type { ForgotPasswordInput, ForgotPasswordResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/**
 * Llama a `POST /auth/forgot-password`. La respuesta es siempre la misma, exista
 * o no la cuenta (AUTH_FLOW.md): no revela si el email está registrado.
 */
export function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
  return httpClient.post<ForgotPasswordResponse>('/auth/forgot-password', input);
}
