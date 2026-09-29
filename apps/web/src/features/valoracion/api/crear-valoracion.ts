import type { CrearValoracionInput, CrearValoracionResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /bookings/:id/valoracion` (HU-515). El dueño sale del token. */
export function crearValoracion(
  bookingId: string,
  input: CrearValoracionInput,
): Promise<CrearValoracionResponse> {
  return httpClient.post<CrearValoracionResponse>(`/bookings/${bookingId}/valoracion`, input);
}
