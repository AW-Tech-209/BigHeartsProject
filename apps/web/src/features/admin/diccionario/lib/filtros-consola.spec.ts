import { TipoEntrada } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { aParamsConsola, cambiarFiltro, leerFiltrosConsola, totalPaginas } from './filtros-consola';

describe('filtros de la consola en la URL', () => {
  it('lee los filtros válidos y descarta los que no se entienden', () => {
    const filtros = leerFiltrosConsola(
      new URLSearchParams(
        'q=drink&modulo=1&categoria=acciones&tipo=verbo&unidad=u1&sena=lista&imagen=con&page=2',
      ),
    );
    expect(filtros).toEqual({
      q: 'drink',
      modulo: 1,
      categoria: 'acciones',
      tipo: TipoEntrada.VERBO,
      unidad: 'U1',
      sena: 'lista',
      imagen: 'con',
      page: 2,
    });
    expect(
      leerFiltrosConsola(new URLSearchParams('modulo=12&sena=quizas&imagen=x&page=0')),
    ).toEqual({});
  });

  it('cambiar un filtro vuelve a la página 1, y cambiar de módulo suelta la unidad', () => {
    expect(
      cambiarFiltro({ modulo: 1, unidad: 'U1', page: 3 }, { tipo: TipoEntrada.FRASE }),
    ).toEqual({
      modulo: 1,
      unidad: 'U1',
      tipo: TipoEntrada.FRASE,
    });
    expect(cambiarFiltro({ modulo: 1, unidad: 'U1' }, { modulo: 2 })).toEqual({ modulo: 2 });
    expect(aParamsConsola({ modulo: 2, q: '' }).toString()).toBe('modulo=2');
  });

  it('cuenta las páginas sin dejar nunca 0', () => {
    expect(totalPaginas(0)).toBe(1);
    expect(totalPaginas(51, 25)).toBe(3);
  });
});
