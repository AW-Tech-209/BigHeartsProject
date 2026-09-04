import { describe, expect, it } from 'vitest';

import { describirCuposRestantes } from './cupos';

describe('describirCuposRestantes', () => {
  it('concuerda en singular con 1', () => {
    expect(describirCuposRestantes(1)).toBe('Queda 1 cupo');
  });

  it('concuerda en plural con 0 y con más de 1', () => {
    expect(describirCuposRestantes(0)).toBe('Quedan 0 cupos');
    expect(describirCuposRestantes(2)).toBe('Quedan 2 cupos');
    expect(describirCuposRestantes(11)).toBe('Quedan 11 cupos');
  });
});
