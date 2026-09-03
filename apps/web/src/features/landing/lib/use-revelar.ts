import { useEffect, useRef, useState } from 'react';

import { useMovimientoReducido } from './use-movimiento-reducido';

/**
 * Revela un elemento al entrar en el viewport. Devuelve la `ref` que hay que
 * poner en el nodo y si ya es visible.
 *
 * Empieza visible cuando no hay `IntersectionObserver` (tests, motores viejos) o
 * cuando el sistema pide movimiento reducido: la animación solo se resta, nunca
 * esconde contenido. Una red de seguridad lo revela igual pasados 3 s por si el
 * observador no dispara (contenedor de scroll ajeno, impresión, captura).
 */
export function useRevelar<T extends HTMLElement = HTMLDivElement>() {
  const movimientoReducido = useMovimientoReducido();
  const ref = useRef<T>(null);
  const soportado = typeof IntersectionObserver !== 'undefined';
  const [visible, setVisible] = useState(() => movimientoReducido || !soportado);

  useEffect(() => {
    if (visible || movimientoReducido || !soportado) return;
    const nodo = ref.current;
    if (!nodo) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(nodo);
    const red = window.setTimeout(() => setVisible(true), 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(red);
    };
  }, [visible, movimientoReducido, soportado]);

  return { ref, visible, anima: !movimientoReducido && soportado };
}
