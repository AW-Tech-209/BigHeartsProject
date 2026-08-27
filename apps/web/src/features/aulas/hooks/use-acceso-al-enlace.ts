import type { EstadoAccesoEnlace } from '@academia/types';
import { useEffect, useState } from 'react';

import { useAnnounce } from '@/hooks/use-announce';

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
 * El servidor ya decidió el estado y el instante en que se abre; este hook
 * solo programa un `setTimeout` para ese instante exacto y actualiza la
 * pantalla sin que el estudiante tenga que recargar. Al ocurrir, lo anuncia
 * por la región viva raíz — es el único punto de la pantalla donde pasa.
 */
export function useAccesoAlEnlace(
  accessState: EstadoAccesoEnlace,
  accessOpensAt: string | null,
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

  useEffect(() => {
    if (accessState !== 'aun-no' || !accessOpensAt) return;

    let temporizador: number;

    function programar() {
      const espera = new Date(accessOpensAt!).getTime() - Date.now();

      if (espera <= 0) {
        setEstado('abierto');
        announce('Ya puedes entrar a la clase.');
        return;
      }

      temporizador = window.setTimeout(programar, Math.min(espera, ESPERA_MAXIMA_MS));
    }

    programar();

    return () => window.clearTimeout(temporizador);
  }, [accessState, accessOpensAt, announce]);

  return estado;
}
