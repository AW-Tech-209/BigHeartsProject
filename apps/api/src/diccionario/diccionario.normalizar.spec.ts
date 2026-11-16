import { TipoEntrada } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { parsearCsv, slugBase, slugUnico, tipoDesdeEtiqueta } from './diccionario.normalizar';

describe('slugs del diccionario', () => {
  it('nace del inglés normalizado', () => {
    expect(slugBase('To eat')).toBe('to-eat');
    expect(slugBase("What's your name?")).toBe('what-s-your-name');
  });

  it('ante una colisión añade -2, -3…', () => {
    expect(slugUnico('to-eat', new Set())).toBe('to-eat');
    expect(slugUnico('to-eat', new Set(['to-eat']))).toBe('to-eat-2');
    expect(slugUnico('to-eat', new Set(['to-eat', 'to-eat-2']))).toBe('to-eat-3');
  });
});

describe('tipoDesdeEtiqueta', () => {
  it('acepta la etiqueta en español con o sin tilde', () => {
    expect(tipoDesdeEtiqueta('Expresión')).toBe(TipoEntrada.EXPRESION);
    expect(tipoDesdeEtiqueta('verbo')).toBe(TipoEntrada.VERBO);
    expect(tipoDesdeEtiqueta('Sustantivo')).toBeNull();
  });
});

describe('parsearCsv', () => {
  it('respeta las comas entre comillas y quita la cabecera', () => {
    const csv =
      'modulo,unidad,categoria,tipo,ingles,espanol\r\n1,U1,Acciones,Verbo,To drink,"Tomar, beber"\r\n';
    expect(parsearCsv(csv)).toEqual([['1', 'U1', 'Acciones', 'Verbo', 'To drink', 'Tomar, beber']]);
  });
});
