import { ApiErrorCode } from '@academia/types';

import { ApiClientError } from '@/lib/api-error';

/** Traduce el fallo de `POST /bookings/:id/valoracion` a un mensaje literal, por `code`. */
export function mensajeErrorValoracion(error: unknown): string {
  const code = error instanceof ApiClientError ? error.code : null;

  switch (code) {
    case ApiErrorCode.FEEDBACK_ALREADY_SENT:
      return 'Ya valoraste esta clase.';
    case ApiErrorCode.FEEDBACK_WINDOW_CLOSED:
      return 'Ya no puedes valorar esta clase: solo se puede hasta 7 días después de que termina.';
    case 'NETWORK_ERROR':
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.';
    default:
      return 'No pudimos enviar tu respuesta. Inténtalo otra vez.';
  }
}
