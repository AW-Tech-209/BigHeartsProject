import type { ApiError } from '@academia/types';

/** Error normalizado que lanza `http-client` para cualquier fallo de red o de la API. */
export class ApiClientError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  /** HTTP status de la respuesta, o `undefined` si nunca llegó a haber respuesta. */
  readonly status?: number;

  constructor(error: ApiError, status?: number) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.details = error.details;
    this.status = status;
  }
}
