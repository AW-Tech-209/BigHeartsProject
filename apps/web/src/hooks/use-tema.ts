import { useCallback, useState } from 'react';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'bighearts:tema';
/** Duración normal (220ms) + margen; ver `.cambiando-tema` en `index.css`. */
const DURACION_TRANSICION_TEMA_MS = 260;

let timeoutTransicion: ReturnType<typeof setTimeout> | undefined;

function cambiarClaseDark(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro');
}

/**
 * En una lista larga (o cualquier pantalla con muchos nodos), transicionar
 * `background-color`/`border-color`/`color` en CADA elemento (`.cambiando-tema
 * *` de `index.css`) obliga al navegador a repintar todos esos nodos en cada
 * fotograma durante 220ms — el costo crece con el tamaño del DOM, y ahí es
 * donde se siente el lag.
 *
 * `View Transitions` evita ese costo: toma una captura de la pantalla ANTES
 * del cambio, aplica el cambio de un tirón (una sola recomposición, no 220ms
 * de por medio) y funde las dos capturas por compositor — un cruce de dos
 * texturas en GPU, con costo fijo sin importar cuántos nodos tenga la página.
 * El resultado visual final es idéntico; solo cambia CÓMO se llega a él.
 *
 * `.cambiando-tema` (`index.css`) queda como resguardo para el navegador que
 * no soporte la API (o cuando el sistema pide movimiento reducido, que aquí
 * SÍ se comprueba porque `startViewTransition` no lo respeta por su cuenta).
 */
function aplicarClase(tema: Tema) {
  const html = document.documentElement;

  const soportaViewTransitions = typeof document.startViewTransition === 'function';
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (soportaViewTransitions && !movimientoReducido) {
    document.startViewTransition(() => cambiarClaseDark(tema));
    return;
  }

  // Resguardo: el cruce por transición CSS de siempre.
  html.classList.add('cambiando-tema');
  if (timeoutTransicion) clearTimeout(timeoutTransicion);
  timeoutTransicion = setTimeout(() => {
    html.classList.remove('cambiando-tema');
  }, DURACION_TRANSICION_TEMA_MS);

  cambiarClaseDark(tema);
}

function leerTemaGuardado(): Tema {
  try {
    return localStorage.getItem(CLAVE) === 'oscuro' ? 'oscuro' : 'claro';
  } catch {
    return 'claro';
  }
}

/**
 * Tema visual del navegador (claro/oscuro). Es preferencia de ESTE navegador,
 * no de la cuenta: `localStorage`, sin endpoint ni columna en `User` (HU-216).
 */
export function useTema() {
  const [tema, setTemaState] = useState<Tema>(leerTemaGuardado);

  const alternar = useCallback(() => {
    setTemaState((actual) => {
      const siguiente: Tema = actual === 'claro' ? 'oscuro' : 'claro';
      aplicarClase(siguiente);
      try {
        localStorage.setItem(CLAVE, siguiente);
      } catch {
        // Si no persiste, el próximo arranque vuelve a claro; no rompe la pantalla actual.
      }
      return siguiente;
    });
  }, []);

  return { tema, alternar };
}
