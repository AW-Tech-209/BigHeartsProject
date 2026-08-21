import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

/**
 * La config de test NO se escribe de cero: se FUSIONA con la de Vite.
 *
 * Es deliberado y no es cosmético. `vite.config.ts` contiene dos cosas de las
 * que dependen los tests:
 *  - el alias `@/*`, que usa medio `src/`;
 *  - `optimizeDeps.include: ['@academia/types']`, la trampa nº 1 del README —
 *    el paquete se compila a CommonJS y hay que decirle a Vite que lo
 *    pre-bundlee.
 *
 * Una config paralela que copiase esos valores se desincronizaría a la primera
 * que alguien tocara una sola de las dos. Heredando, tocar `vite.config.ts`
 * arregla o rompe las dos a la vez, que es la única forma de enterarse.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Como en `@academia/api`. Además, el auto-cleanup de Testing Library
      // solo se registra si existe un `afterEach` global.
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{spec,test}.{ts,tsx}'],
      css: false,
      /*
        15 s, no los 5 s por defecto.

        Los tests de recorrido con teclado escriben con `user-event`, que teclea
        carácter a carácter con temporizadores reales: el de `FormularioAula`
        —once campos— ronda los 4 s él solo, y con los workers de Vitest
        compitiendo por CPU se pasaba de 5 s y fallaba. Era un fallo latente que
        se disparaba al añadir cualquier archivo de test nuevo, no un problema
        del formulario: aparece o no según cuántos tests corran a la vez, que es
        la peor forma de romperse.

        No se sube para tapar un test lento: se sube porque el límite estaba por
        debajo de lo que este tipo de test cuesta de verdad, y en un producto
        para personas sordas el recorrido con teclado no es un test que se pueda
        aligerar quitándole pasos. Detectado en HU-204.
      */
      testTimeout: 15_000,
    },
  }),
);
