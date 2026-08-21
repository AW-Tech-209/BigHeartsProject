import { EstadoTemporalAula } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { buildMisAulasSearchParams, estadoActivo, parseMisAulasQuery } from './filtros-mis-aulas';

describe('parseMisAulasQuery', () => {
  it('sin params, devuelve un query vacío', () => {
    expect(parseMisAulasQuery(new URLSearchParams())).toEqual({});
  });

  it.each(Object.values(EstadoTemporalAula))('lee el estado %s de la URL', (estado) => {
    expect(parseMisAulasQuery(new URLSearchParams(`estado=${estado}`))).toEqual({ estado });
  });

  it('lee el estado junto con la paginación', () => {
    const params = new URLSearchParams('estado=pasadas&page=3&pageSize=10');

    expect(parseMisAulasQuery(params)).toEqual({
      estado: EstadoTemporalAula.PASADAS,
      page: 3,
      pageSize: 10,
    });
  });

  it('ignora un estado que no existe, en vez de romper la pantalla', () => {
    expect(parseMisAulasQuery(new URLSearchParams('estado=archivadas'))).toEqual({});
  });

  it.each(['abc', '0', '-1', '1.5'])('ignora una página inválida: %s', (page) => {
    expect(parseMisAulasQuery(new URLSearchParams(`page=${page}`))).toEqual({});
  });
});

describe('buildMisAulasSearchParams', () => {
  it('sin filtro, la URL queda limpia', () => {
    expect(buildMisAulasSearchParams({}).toString()).toBe('');
  });

  it('escribe el estado elegido', () => {
    expect(buildMisAulasSearchParams({ estado: EstadoTemporalAula.CANCELADAS }).toString()).toBe(
      'estado=canceladas',
    );
  });

  // `todas` es el valor por defecto: ponerlo en la URL no cambia lo que se ve.
  it('omite el estado por defecto y la página 1', () => {
    const params = buildMisAulasSearchParams({ estado: EstadoTemporalAula.TODAS, page: 1 });

    expect(params.toString()).toBe('');
  });

  it('escribe la página a partir de la segunda', () => {
    expect(buildMisAulasSearchParams({ page: 2 }).toString()).toBe('page=2');
  });

  // AC6: ida y vuelta sin pérdida — es lo que hace que copiar el enlace sirva.
  it.each([
    { estado: EstadoTemporalAula.PROXIMAS },
    { estado: EstadoTemporalAula.PASADAS, page: 4 },
    { estado: EstadoTemporalAula.CANCELADAS, page: 2, pageSize: 10 },
  ])('sobrevive a la ida y vuelta por la URL: %o', (query) => {
    expect(parseMisAulasQuery(buildMisAulasSearchParams(query))).toEqual(query);
  });
});

describe('estadoActivo', () => {
  it('sin estado en el query, el activo es «todas»', () => {
    expect(estadoActivo({})).toBe(EstadoTemporalAula.TODAS);
  });

  it('con estado en el query, ese es el activo', () => {
    expect(estadoActivo({ estado: EstadoTemporalAula.PASADAS })).toBe(EstadoTemporalAula.PASADAS);
  });
});
