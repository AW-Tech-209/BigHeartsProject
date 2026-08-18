import { useQuery } from '@tanstack/react-query';

import { getProfile } from '../api/get-profile';

/**
 * Clave de la query del perfil propio. No lleva el id del usuario porque el
 * endpoint tampoco: la caché se vacía al cerrar sesión, no al cambiar de id.
 */
export const profileQueryKey = ['profile', 'me'] as const;

/**
 * Lee el perfil del usuario autenticado desde `GET /users/me`.
 *
 * La fuente de verdad del formulario es esta query, no el `user` del
 * auth-store: el store guarda la foto del login, que puede llevar minutos
 * desactualizada. El store se usa para la barra de sesión; el formulario, para
 * editar, necesita el dato de la BD.
 */
export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
    select: (data) => data.user,
  });
}
