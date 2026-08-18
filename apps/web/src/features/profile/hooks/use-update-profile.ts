import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/auth-store';
import { updateProfile } from '../api/update-profile';
import { profileQueryKey } from './use-profile';

/**
 * Mutación de edición del perfil.
 *
 * Al terminar con éxito hace las dos sincronizaciones que exige la HU-103:
 *  1. Invalida la query del perfil, para que la pantalla refleje lo que quedó
 *     guardado de verdad en la BD y no lo que el formulario creía enviar.
 *  2. Actualiza el `user` del auth-store, que es de donde la barra de sesión
 *     saca el nombre. Sin esto el nombre solo cambiaría al recargar.
 *
 * No hay actualización optimista: el usuario no debe ver "guardado" antes de
 * que el servidor lo confirme.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (data) => {
      setUser(data.user);
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}
