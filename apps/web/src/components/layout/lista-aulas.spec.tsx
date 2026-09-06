import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { ListaAulas } from './lista-aulas';

/**
 * jsdom no aplica hojas de estilo, así que esto vigila el **contrato de clases**:
 * una pila de una columna, nunca una rejilla. La comprobación visual a distintos
 * anchos sigue siendo una pasada manual (`bighearts-dod` §4).
 */
describe('ListaAulas', () => {
  function montar() {
    renderConProviders(
      <ListaAulas>
        <article aria-label="Conversación cotidiana" />
      </ListaAulas>,
    );

    return screen.getByRole('article', { name: 'Conversación cotidiana' }).parentElement;
  }

  it('apila los renglones en una sola columna', () => {
    expect(montar()?.className).toContain('flex flex-col');
  });

  it('no declara ninguna rejilla de columnas', () => {
    expect(montar()?.className).not.toMatch(/grid-cols-/);
  });

  it('separa los renglones con el hueco del sistema', () => {
    expect(montar()?.className).toContain('gap-2.5');
  });
});
