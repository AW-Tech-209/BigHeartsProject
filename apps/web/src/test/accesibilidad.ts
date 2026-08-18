import axe, { type AxeResults, type Result, type RunOptions } from 'axe-core';

/**
 * Reglas que axe no puede evaluar de verdad en jsdom y que solo generarían
 * ruido: jsdom no aplica las hojas de estilo de Tailwind, así que no hay
 * colores calculados que comparar. El contraste está verificado en
 * `tokens.css` del skill `bighearts-ui` y se revisa a mano; automatizarlo
 * aquí daría un falso verde, que es peor que no tenerlo.
 */
const REGLAS_DESACTIVADAS: RunOptions['rules'] = {
  'color-contrast': { enabled: false },
};

/**
 * Corre axe sobre un contenedor y **falla con el detalle de cada violación**.
 *
 * Lo que automatiza: roles, etiquetas de formulario, `aria-*` coherentes,
 * orden de encabezados, nombres accesibles. Lo que NO: que el recorrido con
 * teclado tenga sentido, que el foco vaya donde debe, o que el texto se
 * entienda. Eso sigue necesitando ojo humano — este helper solo reduce lo que
 * hay que mirar a mano, no lo elimina (ver `bighearts-dod` §4).
 *
 * Ejemplo:
 * ```tsx
 * const { container } = renderConProviders(<Field id="email" label="Email">…</Field>);
 * await esperarSinFallosDeAccesibilidad(container);
 * ```
 */
export async function esperarSinFallosDeAccesibilidad(
  container: Element,
  options: RunOptions = {},
): Promise<void> {
  const resultados: AxeResults = await axe.run(container, {
    ...options,
    rules: { ...REGLAS_DESACTIVADAS, ...options.rules },
  });

  if (resultados.violations.length === 0) return;

  throw new Error(formatearViolaciones(resultados.violations));
}

/**
 * El mensaje es el producto de este helper. Un `expect(violations).toEqual([])`
 * imprime un volcado JSON de cientos de líneas en el que no se ve qué falló;
 * un booleano no dice nada. Así que se formatea a mano: qué regla, con qué
 * gravedad, sobre qué elemento y por qué.
 */
function formatearViolaciones(violaciones: Result[]): string {
  const titular =
    violaciones.length === 1
      ? '1 violación de accesibilidad:'
      : `${violaciones.length} violaciones de accesibilidad:`;

  const detalle = violaciones.map((violacion) => {
    const nodos = violacion.nodes.map((nodo) => {
      const motivo = nodo.failureSummary?.trim() ?? 'Sin detalle.';
      return [`    ${nodo.html}`, ...motivo.split('\n').map((linea) => `      ${linea.trim()}`)]
        .join('\n')
        .concat('\n');
    });

    return [
      `  [${violacion.id}] (${violacion.impact ?? 'sin gravedad'}) ${violacion.help}`,
      `  ${violacion.helpUrl}`,
      ...nodos,
    ].join('\n');
  });

  return [titular, '', ...detalle].join('\n');
}
