import { ApiErrorCode } from '@academia/types';

import { ApiClientError } from '@/lib/api-error';

/** Traduce el fallo de `POST /classrooms/:id/asistencia` a un mensaje literal, por `code`. */
export function mensajeErrorAsistencia(error: unknown): string {
  const code = error instanceof ApiClientError ? error.code : null;

  switch (code) {
    case ApiErrorCode.CLASS_NOT_FINISHED:
      return 'Todavía no puedes marcar asistencia: la clase no ha terminado.';
    case ApiErrorCode.BOOKING_NOT_IN_CLASSROOM:
      return 'No encontramos esa reserva en esta clase.';
    case 'NETWORK_ERROR':
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.';
    default:
      return error instanceof ApiClientError && error.message
        ? error.message
        : 'No pudimos guardar la asistencia. Inténtalo otra vez.';
  }
}
