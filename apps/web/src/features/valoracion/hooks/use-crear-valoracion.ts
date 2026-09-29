import type { CrearValoracionInput } from '@academia/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { crearValoracion } from '../api/crear-valoracion';

/**
 * Envía la valoración de una reserva (HU-515). Sin optimismo: `puedeValorar`
 * solo cambia cuando el servidor lo confirma, y entonces «Mis reservas» y el
 * historial se vuelven a pedir para que la tarjeta y la acción de la fila
 * desaparezcan.
 */
export function useCrearValoracion(bookingId: string, onEnviada: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearValoracionInput) => crearValoracion(bookingId, input),
    onSuccess: async () => {
      // Antes de invalidar: al refrescar, el formulario puede desmontarse y
      // los callbacks de `mutate()` ya no correrían.
      onEnviada();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservas', 'mias'] }),
        queryClient.invalidateQueries({ queryKey: ['historial'] }),
      ]);
    },
  });
}
