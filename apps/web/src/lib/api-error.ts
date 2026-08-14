import type { ApiError, ApiResponse } from '@academia/types';
import axios from 'axios';

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

/**
 * Convierte cualquier cosa que axios pueda rechazar en una `ApiClientError`.
 *
 * Vive aquí, y no dentro del interceptor, porque hay DOS clientes de axios que
 * necesitan la misma normalización: `http-client` (el general) y el cliente
 * crudo de `refresh-session` (que no puede pasar por los interceptores). Así
 * un fallo de refresh y un fallo de cualquier otra petición llegan a la UI con
 * la misma forma y el mismo `code`.
 */
export function toApiClientError(error: unknown): unknown {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (axios.isAxiosError<ApiResponse>(error)) {
    const body = error.response?.data;

    if (body && !body.success) {
      return new ApiClientError(body.error, error.response?.status);
    }

    // Sin respuesta del servidor (DNS, CORS, offline, timeout): no hay envelope
    // que desenvolver, así que fabricamos un código propio y estable.
    const networkError: ApiError = { code: 'NETWORK_ERROR', message: error.message };
    return new ApiClientError(networkError);
  }

  return error;
}
