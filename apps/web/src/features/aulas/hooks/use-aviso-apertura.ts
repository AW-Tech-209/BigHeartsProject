import { EstadoTemporalAula, type MisReservasQuery } from '@academia/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { mostrarNotificacionDeApertura } from '@/features/aulas/lib/notificacion-navegador';
import { useAvisoAperturaStore } from '@/stores/aviso-apertura-store';
import { misReservasQueryKey, useMisReservas } from './use-mis-reservas';

const CONSULTA: MisReservasQuery = { estado: EstadoTemporalAula.PROXIMAS, pageSize: 1 };
const HORIZONTE_MS = 2 * 60 * 60_000;
/** Que el servidor ya haya cruzado el umbral cuando se le pregunta. */
const MARGEN_MS = 1_000;

/**
 * Lleva fuera de la página el paso de «aún no» a «abierto» de la próxima
 * reserva. El reloj del cliente solo decide *cuándo preguntar*: el aviso sale
 * únicamente si el servidor responde que el acceso está abierto (§4.1, §4.7).
 */
export function useAvisoApertura() {
  const queryClient = useQueryClient();
  const { data } = useMisReservas(CONSULTA);
  const reserva = data?.items[0];

  const id = reserva?.id;
  const titulo = reserva?.title;
  const estado = reserva?.accessState;
  const abreEn = reserva?.accessOpensAt;
  const empieza = reserva?.scheduledAt;
  const duracion = reserva?.durationMinutes;

  useEffect(() => {
    if (!id || estado !== 'aun-no' || !abreEn) return;

    const espera = new Date(abreEn).getTime() - Date.now();
    if (espera > HORIZONTE_MS) return;

    useAvisoAperturaStore.getState().esperar(id);
    const temporizador = window.setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: misReservasQueryKey(CONSULTA) }),
      Math.max(espera, 0) + MARGEN_MS,
    );

    return () => window.clearTimeout(temporizador);
  }, [id, estado, abreEn, queryClient]);

  useEffect(() => {
    if (!id || !titulo || estado !== 'abierto' || !empieza || !duracion) return;

    const terminaEn = new Date(new Date(empieza).getTime() + duracion * 60_000).toISOString();
    const store = useAvisoAperturaStore.getState();
    const esNueva = store.abrir(id, { classroomId: id, titulo, terminaEn });

    if (esNueva && store.notificarEnNavegador) mostrarNotificacionDeApertura(id, titulo);
  }, [id, titulo, estado, empieza, duracion]);
}
