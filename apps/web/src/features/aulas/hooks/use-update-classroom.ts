import type { UpdateClassroomInput } from '@academia/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateClassroom } from '../api/update-classroom';
import { classroomQueryKey } from './use-classroom';

/**
 * Edita un aula (HU-202). Invalida su detalle y todas las de «Mis aulas», con
 * el prefijo `['aulas', 'mias']` — mismo criterio que `useUpdateProfile`.
 *
 * Sin actualización optimista: el profesor no ve el cambio antes de que el
 * servidor lo confirme.
 */
export function useUpdateClassroom(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateClassroomInput) => updateClassroom(classroomId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classroomQueryKey(classroomId) }),
        queryClient.invalidateQueries({ queryKey: ['aulas', 'mias'] }),
      ]);
    },
  });
}
