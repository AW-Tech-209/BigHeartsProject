import { useQuery } from '@tanstack/react-query';

import { getTeachers } from '../api/get-teachers';

/** Clave de la query de todos los profesores (selector del filtro de supervisión). */
export const teachersQueryKey = ['admin', 'teachers'] as const;

/**
 * Lee todos los profesores desde `GET /admin/teachers`.
 *
 * `select` deja fuera el envoltorio `{ teachers }`, igual que `usePendingTeachers`.
 */
export function useTeachers() {
  return useQuery({
    queryKey: teachersQueryKey,
    queryFn: getTeachers,
    select: (data) => data.teachers,
  });
}
