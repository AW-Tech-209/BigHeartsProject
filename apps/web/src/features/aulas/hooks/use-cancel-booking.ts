import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelBooking } from '../api/cancel-booking';
import { classroomQueryKey } from './use-classroom';

/**
 * Cancela una reserva propia (HU-303). Invalida el detalle del aula —de donde
 * sale el `myBookingCancelable` fresco—, «Mis reservas» y el catálogo, donde
 * la tarjeta vuelve a ofrecer «Reservar mi cupo» sobre el cupo liberado.
 */
export function useCancelBooking(bookingId: string, classroomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelBooking(bookingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: classroomQueryKey(classroomId) }),
        queryClient.invalidateQueries({ queryKey: ['reservas', 'mias'] }),
        queryClient.invalidateQueries({ queryKey: ['aulas', 'listado'] }),
      ]);
    },
  });
}
