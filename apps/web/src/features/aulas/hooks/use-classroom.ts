import { ApiErrorCode } from '@academia/types';
import { useQuery } from '@tanstack/react-query';

import { ApiClientError } from '@/lib/api-error';
import { getClassroom } from '../api/get-classroom';

/** Clave del detalle de un aula. Una entrada por aula, no una lista. */
export const classroomQueryKey = (id: string) => ['aulas', 'detalle', id] as const;

/**
 * Reintentos ante un fallo transitorio antes de dar la lectura por perdida.
 *
 * **Uno, no los tres del cliente por defecto.** Un reintento cubre el corte
 * momentáneo de conexión; a partir de ahí, cada ronda de backoff son segundos
 * más de esqueleto sin explicación. Es mejor enseñar el error con su botón
 * `Volver a cargar` —donde el usuario decide y ve que algo pasó— que dejarlo
 * mirando una pantalla que no dice nada durante siete segundos.
 */
const REINTENTOS = 1;

/**
 * ¿El aula no existe? Es un `ApiClientError` con el código estable del catálogo,
 * **nunca el texto del mensaje** (`contrato-api.md` §3).
 *
 * Se exporta porque la pantalla necesita la misma pregunta para elegir entre el
 * estado «no encontrada» y el de error, y las dos respuestas tienen que salir
 * del mismo sitio.
 */
export function esAulaNoEncontrada(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === ApiErrorCode.CLASSROOM_NOT_FOUND;
}

/**
 * Lee el detalle de un aula desde `GET /classrooms/:id`.
 *
 * **Un 404 no se reintenta.** Reintentarlo haría esperar tres rondas de backoff
 * antes de enseñar el estado de «no encontrada», que es una respuesta
 * definitiva: el aula no va a aparecer por insistir. El resto de fallos —red,
 * 500— sí se reintentan, porque ahí insistir sí puede funcionar.
 *
 * Sin `placeholderData`: aquí no se cambia de filtro ni de página, así que no
 * hay una respuesta anterior que mantener mientras llega la siguiente.
 */
export function useClassroom(id: string) {
  return useQuery({
    queryKey: classroomQueryKey(id),
    queryFn: () => getClassroom(id),
    retry: (intentos, error) => !esAulaNoEncontrada(error) && intentos < REINTENTOS,
  });
}
