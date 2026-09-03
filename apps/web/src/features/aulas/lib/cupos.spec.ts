import { describe, expect, it } from 'vitest';

import { pluralizarCupos } from './cupos';

describe('pluralizarCupos', () => {
  it('usa el singular con 1', () => {
    expect(pluralizarCupos(1)).toBe('1 cupo');
  });

  it('usa el plural con 0 y con más de 1', () => {
    expect(pluralizarCupos(0)).toBe('0 cupos');
    expect(pluralizarCupos(2)).toBe('2 cupos');
    expect(pluralizarCupos(11)).toBe('11 cupos');
  });
});
