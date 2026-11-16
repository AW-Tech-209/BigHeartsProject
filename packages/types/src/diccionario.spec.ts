import { describe, expect, it } from 'vitest';

import { normalizarTexto } from './diccionario';

describe('normalizarTexto', () => {
  it('quita tildes y diéresis', () => {
    expect(normalizarTexto('Lápiz')).toBe('lapiz');
    expect(normalizarTexto('Pingüino')).toBe('pinguino');
  });

  it('pasa a minúsculas y colapsa espacios', () => {
    expect(normalizarTexto('  To   EAT ')).toBe('to eat');
  });

  it('quita los signos de pregunta y exclamación', () => {
    expect(normalizarTexto('¿Dónde está?')).toBe('donde esta');
    expect(normalizarTexto('¡Hola!')).toBe('hola');
  });
});
