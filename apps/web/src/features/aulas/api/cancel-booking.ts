import type { CancelBookingResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /bookings/:id/cancelar` (HU-303). Devuelve la reserva ya cancelada. */
export function cancelBooking(bookingId: string): Promise<CancelBookingResponse> {
  return httpClient.post<CancelBookingResponse>(`/bookings/${bookingId}/cancelar`);
}
