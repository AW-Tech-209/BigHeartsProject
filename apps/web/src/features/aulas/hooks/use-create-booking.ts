import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBooking } from '../api/create-booking';
import { classroomQueryKey } from './use-classroom';

/**
 * Reserva un cupo (HU-301). Sin mutación optimista: `<AccionReservarAula>`
 * solo pinta el resultado cuando esta promesa resuelve (CLAUDE.md, regla 10).
 *
 * Invalida el detalle del aula (T7: «al confirmar, se re-consulta el aula»,
 * de donde sale el nuevo `myBookingStatus`) y el catálogo, donde la tarjeta
 * deja de ofrecer «Reservar» sobre una clase ya reservada.
 */
export function useCreateBooking(classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createBooking(classroomId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classroomQueryKey(classroomId) }),
        queryClient.invalidateQueries({ queryKey: ['aulas', 'listado'] }),
      ]);
    },
  });
}
