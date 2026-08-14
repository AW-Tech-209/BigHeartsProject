import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/auth-store';
import { login } from '../api/login';

/**
 * Mutación de login. Al terminar con éxito guarda la sesión en el store, que es
 * lo que hace que el guard de rutas deje pasar y la UI por rol se pinte.
 *
 * Expone `isPending` / `error` para que el formulario muestre su estado de
 * carga y su mensaje de error.
 */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: setSession,
  });
}
