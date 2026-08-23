import { CommunicationPreference, EnglishLevel } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { buildSearchParams, hayFiltrosActivos, parseListClassroomsQuery } from './filtros-url';

describe('parseListClassroomsQuery', () => {
  it('sin params, devuelve un query vacío', () => {
    expect(parseListClassroomsQuery(new URLSearchParams())).toEqual({});
  });

  it('lee nivel, modo, rango de fechas y paginación', () => {
    const params = new URLSearchParams(
      'level=ADVANCED&communicationMode=SIGN_LANGUAGE&desde=2026-09-01&hasta=2026-09-30&page=2&pageSize=10',
    );

    expect(parseListClassroomsQuery(params)).toEqual({
      level: EnglishLevel.ADVANCED,
      communicationMode: CommunicationPreference.SIGN_LANGUAGE,
      desde: '2026-09-01',
      hasta: '2026-09-30',
      page: 2,
      pageSize: 10,
    });
  });

  it('ignora un nivel que no existe, en vez de romper', () => {
    expect(parseListClassroomsQuery(new URLSearchParams('level=EXPERTO'))).toEqual({});
  });

  it('ignora un modo de comunicación que no existe, en vez de romper', () => {
    expect(parseListClassroomsQuery(new URLSearchParams('communicationMode=TELEPATIA'))).toEqual(
      {},
    );
  });

  it.each(['abc', '0', '-1', '1.5'])('ignora una página inválida: %s', (page) => {
    expect(parseListClassroomsQuery(new URLSearchParams(`page=${page}`))).toEqual({});
  });

  // HU-208, AC6: el filtro del profesor se lee de la URL como los demás.
  it('lee `mias=true`', () => {
    expect(parseListClassroomsQuery(new URLSearchParams('mias=true'))).toEqual({ mias: true });
  });

  // Solo `true` lo enciende: la URL la puede teclear alguien a mano, y un
  // `mias` a medias no debe dejar al profesor mirando un catálogo recortado
  // sin que la casilla lo refleje.
  it.each(['false', '1', 'si', ''])('ignora un valor de mias que no es true: %s', (mias) => {
    expect(parseListClassroomsQuery(new URLSearchParams(`mias=${mias}`))).toEqual({});
  });
});

describe('buildSearchParams — el inverso, para el enlace compartible (AC4)', () => {
  it('omite la página 1: es el default, no hace falta en la URL', () => {
    expect(buildSearchParams({ page: 1 }).toString()).toBe('');
  });

  it('incluye una página distinta de 1', () => {
    expect(buildSearchParams({ page: 3 }).toString()).toBe('page=3');
  });

  it('round-trip: parsear lo que se construyó devuelve el mismo query', () => {
    const original = {
      level: EnglishLevel.BEGINNER,
      communicationMode: CommunicationPreference.WRITTEN_TEXT,
      desde: '2026-09-01',
      hasta: '2026-09-30',
      page: 2,
    };

    expect(parseListClassroomsQuery(buildSearchParams(original))).toEqual(original);
  });

  // AC6: copiar el enlace con el filtro puesto y abrirlo reproduce la vista.
  it('round-trip con `mias` y otro filtro a la vez', () => {
    const original = { mias: true, level: EnglishLevel.ADVANCED };

    expect(buildSearchParams(original).get('mias')).toBe('true');
    expect(parseListClassroomsQuery(buildSearchParams(original))).toEqual(original);
  });

  // Apagado es el default: no ensucia el enlace que el profesor comparte.
  it('omite `mias` cuando está apagado', () => {
    expect(buildSearchParams({ mias: false }).toString()).toBe('');
    expect(buildSearchParams({}).toString()).toBe('');
  });
});

describe('hayFiltrosActivos', () => {
  it('false sin nivel, modo ni fechas, aunque haya página', () => {
    expect(hayFiltrosActivos({ page: 2 })).toBe(false);
  });

  it.each([
    { level: EnglishLevel.BEGINNER },
    { communicationMode: CommunicationPreference.SIGN_LANGUAGE },
    { desde: '2026-09-01' },
    { hasta: '2026-09-30' },
    // `mias` cuenta: «Quitar filtros» tiene que devolver el catálogo completo,
    // no dejarle al profesor la mitad puesta.
    { mias: true },
  ])('true con %o', (query) => {
    expect(hayFiltrosActivos(query)).toBe(true);
  });
});
