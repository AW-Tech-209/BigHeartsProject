import { ApiErrorCode } from '@academia/types';

import { ApiClientError } from '@/lib/api-error';

/**
 * Traduce el fallo de `POST /bookings/:id/cancelar` a un mensaje literal, por
 * `code` (`contrato-api.md` §3: nunca por el texto de `message`).
 */
export function mensajeErrorCancelacion(error: unknown): string {
  const code = error instanceof ApiClientError ? error.code : null;

  switch (code) {
    case ApiErrorCode.CANCELLATION_WINDOW_CLOSED:
      return 'Ya no se puede cancelar: falta menos del tiempo mínimo permitido.';
    case ApiErrorCode.BOOKING_NOT_FOUND:
      return 'No encontramos esa reserva. Puede que ya la hayas cancelado.';
    case 'NETWORK_ERROR':
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.';
    default:
      return error instanceof ApiClientError && error.message
        ? error.message
        : 'No pudimos cancelar tu reserva. Inténtalo otra vez.';
  }
}
