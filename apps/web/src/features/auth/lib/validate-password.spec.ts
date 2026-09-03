import { describe, expect, it } from 'vitest';

import { validatePassword } from './validate-password';

describe('validatePassword', () => {
  it('exige un valor', () => {
    expect(validatePassword('')).toBe('La contraseña es obligatoria.');
  });

  it('exige al menos 8 caracteres', () => {
    expect(validatePassword('Ab1')).toBe('La contraseña debe tener al menos 8 caracteres.');
  });

  it('exige al menos una letra y un número', () => {
    expect(validatePassword('abcdefgh')).toBe(
      'La contraseña debe incluir al menos una letra y un número.',
    );
    expect(validatePassword('12345678')).toBe(
      'La contraseña debe incluir al menos una letra y un número.',
    );
  });

  it('acepta una contraseña que cumple las tres reglas', () => {
    expect(validatePassword('Password123!')).toBeUndefined();
  });
});
