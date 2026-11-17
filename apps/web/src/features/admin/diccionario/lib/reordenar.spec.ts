import { describe, expect, it } from 'vitest';

import { moverEnLista, siguienteCodigoUnidad } from './reordenar';

describe('moverEnLista', () => {
  it('sube y baja una posición', () => {
    expect(moverEnLista(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moverEnLista(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('en los extremos no hay cambio', () => {
    expect(moverEnLista(['a', 'b'], 'a', -1)).toBeNull();
    expect(moverEnLista(['a', 'b'], 'b', 1)).toBeNull();
  });
});

describe('siguienteCodigoUnidad', () => {
  it('sugiere el número siguiente al mayor', () => {
    expect(siguienteCodigoUnidad(['U1', 'U2', 'U6'])).toBe('U7');
    expect(siguienteCodigoUnidad([])).toBe('U1');
  });
});
