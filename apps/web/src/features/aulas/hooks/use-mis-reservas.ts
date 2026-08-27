import type { MisReservasQuery } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getMisReservas } from '../api/get-mis-reservas';

/** Clave de la query de «Mis reservas», parametrizada por el filtro activo. */
export const misReservasQueryKey = (query: MisReservasQuery) =>
  ['reservas', 'mias', query] as const;

/**
 * Lee las reservas del estudiante autenticado desde `GET /bookings/mias`.
 *
 * `placeholderData: keepPreviousData`, mismo criterio que `useMisAulas`: al
 * cambiar de filtro o de página se sigue mostrando la respuesta anterior real
 * mientras llega la nueva, nunca un dato inventado.
 */
export function useMisReservas(query: MisReservasQuery) {
  return useQuery({
    queryKey: misReservasQueryKey(query),
    queryFn: () => getMisReservas(query),
    placeholderData: keepPreviousData,
  });
}
