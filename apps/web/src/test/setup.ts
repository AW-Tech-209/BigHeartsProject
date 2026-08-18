// Matchers de DOM para `expect` (`toBeInTheDocument`, `toHaveAccessibleName`,
// `toBeDisabled`…). La variante `/vitest` es la que registra los matchers en el
// `expect` de Vitest y declara sus tipos.
import '@testing-library/jest-dom/vitest';

/**
 * jsdom no implementa `matchMedia`, y varios componentes (y el propio
 * `prefers-reduced-motion` de la guía de UI) lo consultan. Sin este stub el
 * test revienta con `window.matchMedia is not a function`, que no dice nada
 * sobre lo que se estaba probando.
 *
 * Devuelve siempre "no coincide": el equivalente a un usuario sin preferencias
 * declaradas, que es el caso base que queremos probar.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
