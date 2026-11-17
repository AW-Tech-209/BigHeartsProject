import { TipoEntrada } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { aParams, hayFiltros, leerFiltrosCategoria, nombreUnidad } from './filtros-url';

describe('filtros de la categoría en la URL', () => {
  it('lee tipo, unidad y «solo con seña», normalizando la unidad', () => {
    const filtros = leerFiltrosCategoria(new URLSearchParams('tipo=verbo&unidad=u1&conSena=true'));
    expect(filtros).toEqual({ tipo: TipoEntrada.VERBO, unidad: 'U1', conSena: true });
    expect(aParams(filtros).toString()).toBe('tipo=VERBO&unidad=U1&conSena=true');
  });

  it('ignora valores inválidos en vez de mandarlos al servidor', () => {
    const filtros = leerFiltrosCategoria(new URLSearchParams('tipo=foo&unidad=X9&conSena=si'));
    expect(filtros).toEqual({});
    expect(hayFiltros(filtros)).toBe(false);
  });

  it('nombra la unidad con su número y su nombre', () => {
    expect(nombreUnidad({ codigo: 'U1', nombre: 'Need, Want' })).toBe('Unidad 1 · Need, Want');
    expect(nombreUnidad({ codigo: 'U4', nombre: '' })).toBe('Unidad 4');
  });
});
