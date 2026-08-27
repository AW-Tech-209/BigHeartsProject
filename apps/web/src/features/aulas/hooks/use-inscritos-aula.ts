import { useQuery } from '@tanstack/react-query';

import { getInscritosAula } from '../api/get-inscritos-aula';

/** Clave del listado de inscritos de un aula (HU-305). */
export const inscritosAulaQueryKey = (id: string) => ['aulas', 'inscritos', id] as const;

/** Solo se activa para el dueño: `enabled` evita la petición a quien no la ve. */
export function useInscritosAula(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inscritosAulaQueryKey(id),
    queryFn: () => getInscritosAula(id),
    enabled: options?.enabled ?? true,
  });
}
