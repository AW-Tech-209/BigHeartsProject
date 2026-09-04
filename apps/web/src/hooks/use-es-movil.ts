import { useSyncExternalStore } from 'react';

/**
 * Por debajo del corte `lg` de Tailwind (1024px). La barra superior lleva la
 * marca, tres o cuatro destinos, la cuenta y el tema: por debajo de `lg` no
 * caben sin apretarse, así que ahí manda la barra inferior.
 */
const CONSULTA = '(max-width: 1023px)';

function suscribir(alCambiar: () => void) {
  const media = window.matchMedia(CONSULTA);
  media.addEventListener('change', alCambiar);
  return () => media.removeEventListener('change', alCambiar);
}

function leer() {
  return window.matchMedia(CONSULTA).matches;
}

/**
 * ¿Estamos por debajo de 640px?
 *
 * **Por qué esto y no `hidden sm:flex`.** La barra superior y la barra inferior
 * llevan los mismos destinos. Si las dos estuvieran siempre en el DOM y solo se
 * ocultara una con CSS, un lector de pantalla encontraría **cada enlace dos
 * veces**: «Aulas, Aulas, Mis clases, Mis clases…». En un producto donde el
 * usuario depende por completo de lo que la pantalla y el lector le dicen, esa
 * duplicación no es un detalle cosmético.
 *
 * Así solo existe una navegación a la vez, en el DOM y en el árbol accesible.
 *
 * El tercer argumento de `useSyncExternalStore` es el valor del servidor: aquí
 * no hay SSR, pero jsdom lo usa cuando `matchMedia` no está — y `false`
 * (escritorio) es el caso base correcto para los tests.
 */
export function useEsMovil(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
