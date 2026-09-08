import type { EstadoAccesoEnlace } from '@academia/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAnnounce } from '@/hooks/use-announce';
import { classroomQueryKey } from './use-classroom';

/**
 * El máximo que admite `setTimeout` (2³¹ − 1 ms, ~24.8 días). Por encima,
 * Node y los navegadores lo desbordan y disparan casi de inmediato — una
 * clase publicada con semanas de antelación lo supera con facilidad, así que
 * hay que trocear la espera en vez de programarla de un tirón.
 */
const ESPERA_MAXIMA_MS = 2_147_483_647;

/**
 * El paso de «aún no» a «abierto», en vivo (HU-304, T7).
 *
 * Con `classroomId` (el detalle, que sí muestra el enlace): al cumplirse el
 * plazo se invalida la query en vez de fijar `'abierto'` a mano, porque fuera
 * de la ventana el servidor omite `meetingLink` (§4.1) y un estado optimista
 * dejaría la pantalla sin enlace y sin cuenta atrás.
 *
 * Sin `classroomId` (tarjetas de lista, que nunca traen el enlace): fijar
 * `'abierto'` de inmediato es seguro y no depende de refrescar la lista.
 */
export function useAccesoAlEnlace(
  accessState: EstadoAccesoEnlace,
  accessOpensAt: string | null,
  classroomId?: string,
): EstadoAccesoEnlace {
  const [estado, setEstado] = useState(accessState);
  // Sincroniza con la prop durante el render en vez de en un efecto (patrón
  // recomendado de React para "ajustar estado cuando cambia una prop"): un
  // `setState` síncrono dentro de un efecto dispara un re-render en cascada.
  const [ultimoAccessState, setUltimoAccessState] = useState(accessState);
  if (accessState !== ultimoAccessState) {
    setUltimoAccessState(accessState);
    setEstado(accessState);
  }

  const announce = useAnnounce();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (accessState !== 'aun-no' || !accessOpensAt) return;

    let temporizador: number;
    let disparado = false;

    function programar() {
      const espera = new Date(accessOpensAt!).getTime() - Date.now();

      if (espera <= 0) {
        // Una sola vez: si el refetch tarda, no queremos reprogramar en bucle.
        if (disparado) return;
        disparado = true;

        announce('Ya puedes entrar a la clase.');

        if (classroomId) {
          void queryClient.invalidateQueries({ queryKey: classroomQueryKey(classroomId) });
        } else {
          setEstado('abierto');
        }
        return;
      }

      temporizador = window.setTimeout(programar, Math.min(espera, ESPERA_MAXIMA_MS));
    }

    programar();

    return () => window.clearTimeout(temporizador);
  }, [accessState, accessOpensAt, announce, classroomId, queryClient]);

  return estado;
}
