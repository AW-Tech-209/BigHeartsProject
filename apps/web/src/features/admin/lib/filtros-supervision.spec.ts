import { ClassroomStatus } from '@academia/types';
import { describe, expect, it } from 'vitest';

import {
  buildAdminClassroomsSearchParams,
  hayFiltrosActivos,
  parseAdminClassroomsQuery,
} from './filtros-supervision';

describe('parseAdminClassroomsQuery', () => {
  it('sin params, devuelve un query vacío', () => {
    expect(parseAdminClassroomsQuery(new URLSearchParams())).toEqual({});
  });

  it('lee profesor, estado, rango de fechas y página', () => {
    const params = new URLSearchParams(
      'teacherId=profe-1&status=CANCELLED&desde=2026-09-01&hasta=2026-09-30&page=2',
    );

    expect(parseAdminClassroomsQuery(params)).toEqual({
      teacherId: 'profe-1',
      status: ClassroomStatus.CANCELLED,
      desde: '2026-09-01',
      hasta: '2026-09-30',
      page: 2,
    });
  });

  // D15/D16: en Fase 1 un aula solo puede estar PUBLISHED o CANCELLED de
  // verdad. `DRAFT` y `COMPLETED` no tienen ningún caso alcanzable.
  it.each(['DRAFT', 'COMPLETED', 'ALGO_INVENTADO'])(
    'ignora un estado que no es PUBLISHED ni CANCELLED: %s',
    (status) => {
      expect(parseAdminClassroomsQuery(new URLSearchParams(`status=${status}`))).toEqual({});
    },
  );

  it.each(['abc', '0', '-1', '1.5'])('ignora una página inválida: %s', (page) => {
    expect(parseAdminClassroomsQuery(new URLSearchParams(`page=${page}`))).toEqual({});
  });
});

describe('buildAdminClassroomsSearchParams — el inverso, para el enlace compartible (AC5)', () => {
  it('omite la página 1: es el default', () => {
    expect(buildAdminClassroomsSearchParams({ page: 1 }).toString()).toBe('');
  });

  it('incluye una página distinta de 1', () => {
    expect(buildAdminClassroomsSearchParams({ page: 3 }).toString()).toBe('page=3');
  });

  it('combina los tres filtros de contenido en la misma URL', () => {
    const params = buildAdminClassroomsSearchParams({
      teacherId: 'profe-1',
      status: ClassroomStatus.PUBLISHED,
      desde: '2026-01-01',
    });

    expect(params.get('teacherId')).toBe('profe-1');
    expect(params.get('status')).toBe(ClassroomStatus.PUBLISHED);
    expect(params.get('desde')).toBe('2026-01-01');
  });
});

describe('hayFiltrosActivos', () => {
  it('es false sin ningún filtro de contenido', () => {
    expect(hayFiltrosActivos({})).toBe(false);
    expect(hayFiltrosActivos({ page: 2 })).toBe(false);
  });

  it.each([
    { teacherId: 'profe-1' },
    { status: ClassroomStatus.CANCELLED },
    { desde: '2026-01-01' },
    { hasta: '2026-01-01' },
  ])('es true con %o', (query) => {
    expect(hayFiltrosActivos(query)).toBe(true);
  });
});
