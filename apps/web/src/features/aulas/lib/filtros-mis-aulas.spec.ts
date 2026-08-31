import { describe, expect, it } from 'vitest';

import { buildMisAulasSearchParams, parseMisAulasQuery } from './filtros-mis-aulas';

describe('parseMisAulasQuery', () => {
  it('sin params, devuelve un query vacío', () => {
    expect(parseMisAulasQuery(new URLSearchParams())).toEqual({});
  });

  it('lee la página y el tamaño de página', () => {
    expect(parseMisAulasQuery(new URLSearchParams('page=3&pageSize=10'))).toEqual({
      page: 3,
      pageSize: 10,
    });
  });

  it.each(['abc', '0', '-1', '1.5'])('ignora una página inválida: %s', (page) => {
    expect(parseMisAulasQuery(new URLSearchParams(`page=${page}`))).toEqual({});
  });
});

describe('buildMisAulasSearchParams', () => {
  it('sin página ni tamaño, la URL queda limpia', () => {
    expect(buildMisAulasSearchParams({}).toString()).toBe('');
  });

  it('omite la página 1', () => {
    expect(buildMisAulasSearchParams({ page: 1 }).toString()).toBe('');
  });

  it('escribe la página a partir de la segunda', () => {
    expect(buildMisAulasSearchParams({ page: 2 }).toString()).toBe('page=2');
  });

  it('sobrevive a la ida y vuelta por la URL', () => {
    const query = { page: 4, pageSize: 10 };
    expect(parseMisAulasQuery(buildMisAulasSearchParams(query))).toEqual(query);
  });
});
