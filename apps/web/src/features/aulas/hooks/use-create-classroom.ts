import { useMutation } from '@tanstack/react-query';

import { createClassroom } from '../api/create-classroom';

/**
 * Mutación de creación de aula. Expone `isPending`/`isError` y el aula creada
 * en `data`.
 *
 * **Sin `onMutate` ni actualización optimista**, y no por descuido: el skill de
 * UI lo prohíbe para todo lo que toque cupos. Un aula que aparece en pantalla
 * antes de que el servidor confirme es un aula que el profesor cree publicada y
 * que quizá no existe. Aquí no hay concurrencia todavía, pero la regla se
 * mantiene: el estado de la pantalla lo fija la respuesta.
 */
export function useCreateClassroom() {
  return useMutation({ mutationFn: createClassroom });
}
