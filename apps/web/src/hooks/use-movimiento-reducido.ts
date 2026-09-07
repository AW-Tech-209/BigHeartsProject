import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function suscribir(alCambiar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener('change', alCambiar);
  return () => mq.removeEventListener('change', alCambiar);
}

/**
 * `true` si el sistema pide movimiento reducido. Se usa para arrancar
 * demostraciones en pausa y para no disparar pulsos como `alerta-visual` —
 * nunca para esconder contenido.
 */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
