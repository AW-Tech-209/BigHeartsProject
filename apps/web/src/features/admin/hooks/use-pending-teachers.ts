import { useQuery } from '@tanstack/react-query';

import { getPendingTeachers } from '../api/get-pending-teachers';

/** Clave de la query de la cola de aprobación. */
export const pendingTeachersQueryKey = ['admin', 'teachers', 'pending'] as const;

/**
 * Lee los profesores que esperan aprobación desde `GET /admin/teachers/pending`.
 *
 * `select` deja fuera el envoltorio `{ teachers }` para que la pantalla trabaje
 * con la lista directamente, igual que `useProfile` hace con `{ user }`.
 */
export function usePendingTeachers() {
  return useQuery({
    queryKey: pendingTeachersQueryKey,
    queryFn: getPendingTeachers,
    select: (data) => data.teachers,
  });
}
