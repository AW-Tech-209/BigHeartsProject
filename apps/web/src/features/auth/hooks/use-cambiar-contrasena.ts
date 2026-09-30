import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/auth-store';
import { cambiarContrasena } from '../api/cambiar-contrasena';

/** Cambia la contraseña y guarda la sesión nueva (las anteriores quedaron revocadas). */
export function useCambiarContrasena() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({ mutationFn: cambiarContrasena, onSuccess: setSession });
}
