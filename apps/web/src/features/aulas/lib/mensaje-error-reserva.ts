import { ApiErrorCode } from '@academia/types';

import { ApiClientError } from '@/lib/api-error';

/**
 * Traduce el fallo de `POST /bookings` a un mensaje literal, por `code`
 * (T7, `contrato-api.md` §3: nunca por el texto de `message`).
 */
export function mensajeErrorReserva(error: unknown): string {
  const code = error instanceof ApiClientError ? error.code : null;

  switch (code) {
    case ApiErrorCode.CLASSROOM_FULL:
      return 'Ya no quedan cupos en esta clase. Alguien reservó el último mientras tanto.';
    case ApiErrorCode.CLASSROOM_NOT_BOOKABLE:
      return 'Esta clase ya no admite reservas: se canceló o ya empezó.';
    case ApiErrorCode.BOOKING_ALREADY_EXISTS:
      return 'Ya tienes una reserva en esta clase.';
    case ApiErrorCode.BOOKING_OVERLAP:
      return 'Ya tienes otra clase reservada en ese horario.';
    case 'NETWORK_ERROR':
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.';
    default:
      return error instanceof ApiClientError && error.message
        ? error.message
        : 'No pudimos reservar tu cupo. Inténtalo otra vez.';
  }
}
