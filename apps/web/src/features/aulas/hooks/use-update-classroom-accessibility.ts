import type { UpdateClassroomAccessibilityInput } from '@academia/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateClassroomAccessibility } from '../api/update-classroom-accessibility';
import { classroomQueryKey } from './use-classroom';

/**
 * Completa o corrige los 5 campos de accesibilidad de un aula (HU-211, T4).
 *
 * Al terminar, invalida el detalle de ESTA aula y **todas** las de «Mis
 * aulas» — con el prefijo `['aulas', 'mias']`, no una clave exacta, porque
 * `useMisAulas` parametriza su clave por el filtro activo (`estado`, página)
 * y no hay forma de saber desde aquí cuál tenía montado la pantalla que
 * navegó a esta página. Mismo criterio que `useUpdateProfile`.
 *
 * Sin actualización optimista: el profesor no ve «completado» antes de que
 * el servidor lo confirme.
 */
export function useUpdateClassroomAccessibility(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateClassroomAccessibilityInput) =>
      updateClassroomAccessibility(classroomId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classroomQueryKey(classroomId) }),
        queryClient.invalidateQueries({ queryKey: ['aulas', 'mias'] }),
      ]);
    },
  });
}
