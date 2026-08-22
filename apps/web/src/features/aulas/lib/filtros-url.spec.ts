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
  ])('true con %o', (query) => {
    expect(hayFiltrosActivos(query)).toBe(true);
  });
});
