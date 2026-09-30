import type { AdminUsuariosQuery, CrearUsuarioInput, CuentaCreadaResponse } from '@academia/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { crearUsuario, generarContrasenaTemporal, getAdminUsuarios } from '../api/usuarios';

export const adminUsuariosQueryKey = ['admin', 'usuarios'] as const;

export function useAdminUsuarios(query: AdminUsuariosQuery) {
  return useQuery({
    queryKey: [...adminUsuariosQueryKey, query],
    queryFn: () => getAdminUsuarios(query),
  });
}

/**
 * La contraseña temporal sale por `onCuenta` y **no** se devuelve: lo que
 * devuelve `mutationFn` queda en la caché de React Query, y ahí no debe estar.
 */
function useMutacionDeCuenta<V>(llamar: (variables: V) => Promise<CuentaCreadaResponse>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variables,
      onCuenta,
    }: {
      variables: V;
      onCuenta: (cuenta: CuentaCreadaResponse) => void;
    }) => {
      const cuenta = await llamar(variables);
      onCuenta(cuenta);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsuariosQueryKey }),
  });
}

export function useCrearUsuario() {
  return useMutacionDeCuenta<CrearUsuarioInput>(crearUsuario);
}

export function useGenerarContrasena() {
  return useMutacionDeCuenta<string>(generarContrasenaTemporal);
}
