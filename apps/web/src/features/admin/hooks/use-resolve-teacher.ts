import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAnnounce } from '@/hooks/use-announce';
import { resolveTeacher } from '../api/resolve-teacher';
import { fullName, resolutionCopy } from '../lib/teacher-resolution';
import { pendingTeachersQueryKey } from './use-pending-teachers';

/**
 * Aprueba o rechaza a un profesor.
 *
 * **Sin actualización optimista.** La fila no desaparece hasta que el servidor
 * confirma, y no es una precaución genérica: dos administradores pueden tener
 * la misma lista abierta, así que el servidor puede responder
 * `INVALID_STATUS_TRANSITION` porque el otro llegó antes. Quitar la fila de
 * inmediato mostraría una decisión que quizá no ocurrió, y en una pantalla sin
 * señal sonora el usuario no tiene forma de enterarse de que se deshizo.
 *
 * Al confirmar hace las dos cosas que pide el B5 de la HU-104:
 *  1. Invalida la cola, para que la tabla refleje lo que hay en la BD y no lo
 *     que el cliente creía pedir. Es también lo que refresca la lista si otro
 *     administrador resolvió otras solicitudes mientras tanto.
 *  2. Anuncia el resultado por la región viva. La fila se desvanece de la tabla
 *     sin ruido; quien usa lector de pantalla necesita que se lo digan.
 */
export function useResolveTeacher() {
  const queryClient = useQueryClient();
  const announce = useAnnounce();

  return useMutation({
    mutationFn: resolveTeacher,
    onSuccess: async (data, variables) => {
      // El nombre sale de la RESPUESTA, no de la fila que se pulsó: es el dato
      // que el servidor acaba de escribir.
      announce(resolutionCopy[variables.resolution].announcement(fullName(data.user)));
      await queryClient.invalidateQueries({ queryKey: pendingTeachersQueryKey });
    },
  });
}
