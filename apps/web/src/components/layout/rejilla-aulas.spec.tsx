import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { RejillaAulas } from './rejilla-aulas';

/**
 * Lo que se puede y lo que no se puede comprobar aquí.
 *
 * jsdom **no aplica las hojas de estilo**: no hay media queries evaluadas ni
 * `grid-template-columns` calculado, así que ningún test de este archivo mide
 * columnas a 500, 800 o 1200 píxeles de verdad. Lo que sí vigila es el
 * **contrato de clases** que produce esas columnas, y sobre todo el límite: que
 * nunca aparezca una cuarta. La comprobación visual a esos tres anchos sigue
 * siendo una pasada manual (`bighearts-dod` §4).
 */
describe('RejillaAulas', () => {
  function montar() {
    renderConProviders(
      <RejillaAulas>
        <article aria-label="Conversación cotidiana" />
      </RejillaAulas>,
    );

    // Se llega a la rejilla desde un nodo real del árbol accesible, no por una
    // clase ni por un `data-testid`.
    return screen.getByRole('article', { name: 'Conversación cotidiana' }).parentElement;
  }

  it('declara 1 columna en móvil, 2 desde 640px y 3 desde 1024px', () => {
    const rejilla = montar();

    expect(rejilla?.className).toContain('grid-cols-1');
    expect(rejilla?.className).toContain('sm:grid-cols-2');
    expect(rejilla?.className).toContain('lg:grid-cols-3');
  });

  it('nunca declara una cuarta columna, en ningún punto de corte', () => {
    const rejilla = montar();

    // A partir de la cuarta columna el título de un aula parte en tres líneas y
    // la lista deja de poder escanearse, que es para lo que existe la tarjeta.
    expect(rejilla?.className).not.toMatch(/grid-cols-([4-9]|1[0-2])\b/);
  });

  it('separa las tarjetas con el hueco del sistema', () => {
    expect(montar()?.className).toContain('gap-3');
  });
});
