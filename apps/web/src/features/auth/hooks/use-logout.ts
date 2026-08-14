import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/auth-store';
import { logout } from '../api/logout';

/**
 * Mutación de cierre de sesión.
 *
 * El estado local se limpia SIEMPRE, falle o no la llamada al servidor: si el
 * usuario pulsó "Cerrar sesión" y le dejáramos la sesión abierta por un fallo
 * de red, la pantalla estaría mintiendo sobre algo que le importa. Cuando la
 * llamada sí llega, el backend revoca el refresh token, así que la cookie deja
 * de servir para renovar nada.
 *
 * También se vacía la caché de React Query: los datos cacheados pertenecen al
 * usuario que se acaba de ir y no deben verse en la siguiente sesión.
 */
export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession('logout');
      queryClient.clear();
    },
  });
}
