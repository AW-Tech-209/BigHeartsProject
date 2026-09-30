import type { CambiarContrasenaInput, CambiarContrasenaResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /auth/cambiar-contrasena`: devuelve la sesión nueva, ya sin la bandera. */
export function cambiarContrasena(
  input: CambiarContrasenaInput,
): Promise<CambiarContrasenaResponse> {
  return httpClient.post<CambiarContrasenaResponse>('/auth/cambiar-contrasena', input);
}
