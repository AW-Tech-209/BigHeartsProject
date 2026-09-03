import type { ResetPasswordInput, ResetPasswordResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /auth/reset-password` con el token del correo y la contraseña nueva. */
export function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResponse> {
  return httpClient.post<ResetPasswordResponse>('/auth/reset-password', input);
}
