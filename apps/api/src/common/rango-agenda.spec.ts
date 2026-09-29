import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { leerRangoAgenda } from './rango-agenda';

describe('leerRangoAgenda', () => {
  it('sin extremos no hay rango: el listado pagina como siempre', () => {
    expect(leerRangoAgenda({})).toBeNull();
  });

  it('devuelve el rango de una semana', () => {
    const r = leerRangoAgenda({ desde: '2026-09-28T05:00:00Z', hasta: '2026-10-05T05:00:00Z' });
    expect(r?.hasta.getTime()).toBeGreaterThan(r!.desde.getTime());
  });

  it.each([
    ['solo desde', { desde: '2026-09-28T05:00:00Z' }],
    ['solo hasta', { hasta: '2026-09-28T05:00:00Z' }],
    ['invertido', { desde: '2026-10-05T05:00:00Z', hasta: '2026-09-28T05:00:00Z' }],
    ['más de 42 días', { desde: '2026-09-01T00:00:00Z', hasta: '2026-10-14T00:00:01Z' }],
  ])('%s es un 400', (_caso, query) => {
    expect(() => leerRangoAgenda(query)).toThrow(BadRequestException);
  });

  it('42 días exactos sí caben', () => {
    expect(
      leerRangoAgenda({ desde: '2026-09-01T00:00:00Z', hasta: '2026-10-13T00:00:00Z' }),
    ).not.toBeNull();
  });
});
