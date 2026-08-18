import { describe, expect, it } from 'vitest';

import { validateLogin } from './validate-login';

/**
 * PATRÓN A COPIAR — lógica pura.
 *
 * Sin providers, sin DOM, sin mocks: entra un objeto, sale otro. Toda función
 * de `features/<dominio>/lib/` se prueba así, y `bighearts-dod` §5 la exige.
 */

describe('validateLogin', () => {
  it('acepta un email y una contraseña válidos', () => {
    expect(validateLogin({ email: 'ana@correo.com', password: 'Password123!' })).toEqual({});
  });

  it('exige el email cuando está vacío o solo tiene espacios', () => {
    expect(validateLogin({ email: '', password: 'x' }).email).toBe('El email es obligatorio.');
    expect(validateLogin({ email: '   ', password: 'x' }).email).toBe('El email es obligatorio.');
  });

  it('rechaza un email sin arroba o sin dominio, y el mensaje incluye un ejemplo', () => {
    const error = validateLogin({ email: 'ana.correo.com', password: 'x' }).email;

    // El microcopy manda: el error explica y enseña la forma correcta, no se
    // limita a decir "inválido" (ver `voz-microcopy.md`).
    expect(error).toContain('nombre@correo.com');
    expect(validateLogin({ email: 'ana@correo', password: 'x' }).email).toBe(error);
    expect(validateLogin({ email: 'ana@ correo.com', password: 'x' }).email).toBe(error);
  });

  it('ignora los espacios de alrededor del email antes de validar su forma', () => {
    expect(validateLogin({ email: '  ana@correo.com  ', password: 'x' })).toEqual({});
  });

  it('exige la contraseña cuando está vacía', () => {
    expect(validateLogin({ email: 'ana@correo.com', password: '' }).password).toBe(
      'La contraseña es obligatoria.',
    );
  });

  it('NO valida la fuerza de la contraseña: esa regla es del registro', () => {
    // Una cuenta antigua puede tener una contraseña que ya no cumple las reglas
    // nuevas. Bloquearla aquí le impediría entrar con un mensaje falso.
    expect(validateLogin({ email: 'ana@correo.com', password: 'abc' })).toEqual({});
  });

  it('devuelve los dos errores a la vez cuando el formulario llega vacío', () => {
    expect(Object.keys(validateLogin({ email: '', password: '' }))).toEqual(['email', 'password']);
  });
});
