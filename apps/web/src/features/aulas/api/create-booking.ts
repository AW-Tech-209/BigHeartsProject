import type { CreateBookingResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `POST /bookings` (HU-301). Devuelve la reserva ya confirmada. */
export function createBooking(classroomId: string): Promise<CreateBookingResponse> {
  return httpClient.post<CreateBookingResponse>('/bookings', { classroomId });
}
