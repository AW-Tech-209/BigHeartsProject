import type { MarkAttendanceInput } from '@academia/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markAttendance } from '../api/mark-attendance';
import { inscritosAulaQueryKey } from './use-inscritos-aula';

/** Marca o corrige la asistencia de un inscrito (HU-403). Sin optimismo: solo tras la respuesta. */
export function useMarkAttendance(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MarkAttendanceInput) => markAttendance(classroomId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inscritosAulaQueryKey(classroomId) });
    },
  });
}
