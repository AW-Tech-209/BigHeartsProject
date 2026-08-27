import type { InscritosAulaResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `GET /classrooms/:id/inscritos` (HU-305). Solo la usa el profesor dueño. */
export function getInscritosAula(id: string): Promise<InscritosAulaResponse> {
  return httpClient.get<InscritosAulaResponse>(`/classrooms/${id}/inscritos`);
}
