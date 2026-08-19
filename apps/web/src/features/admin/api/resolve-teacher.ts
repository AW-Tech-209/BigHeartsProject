import type { TeacherApprovalResponse } from '@academia/types';

import { httpClient } from '@/lib/http-client';
import type { TeacherResolution } from '../lib/teacher-resolution';

/** El segmento de ruta de cada desenlace. */
const RESOLUTION_PATH: Record<TeacherResolution, string> = {
  approve: 'approve',
  reject: 'reject',
};

export type ResolveTeacherInput = {
  teacherId: string;
  resolution: TeacherResolution;
};

/**
 * Llama a `POST /admin/teachers/:id/approve` o `.../reject`.
 *
 * Son dos rutas y no un `PATCH` con el estado en el cuerpo a propósito: el
 * cuerpo permitiría pedir cualquier `UserStatus` —`SUSPENDED` incluido— y
 * obligaría al servidor a defenderse de estados que esta pantalla nunca debe
 * poder pedir. Con dos rutas, las únicas transiciones alcanzables son las dos
 * que §4.5 declara válidas.
 *
 * Sin cuerpo: el id va en la ruta y no hay nada más que decidir.
 */
export function resolveTeacher({
  teacherId,
  resolution,
}: ResolveTeacherInput): Promise<TeacherApprovalResponse> {
  return httpClient.post<TeacherApprovalResponse>(
    `/admin/teachers/${teacherId}/${RESOLUTION_PATH[resolution]}`,
  );
}
