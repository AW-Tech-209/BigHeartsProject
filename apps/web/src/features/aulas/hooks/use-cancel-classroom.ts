import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelClassroom } from '../api/cancel-classroom';
import { classroomQueryKey } from './use-classroom';

/** Cancela un aula propia (HU-202, AC2). Invalida su detalle y «Mis aulas». */
export function useCancelClassroom(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelClassroom(classroomId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classroomQueryKey(classroomId) }),
        queryClient.invalidateQueries({ queryKey: ['aulas', 'mias'] }),
      ]);
    },
  });
}
