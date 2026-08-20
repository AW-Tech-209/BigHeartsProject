import { describe, expect, it } from 'vitest';

import { validateEnv } from './env.validation';

/**
 * Que la app se NIEGUE A ARRANCAR sin su configuración es una garantía de
 * producto, no un detalle de implementación: un despliegue sin
 * `MEETING_LINK_KEY` que arrancase igual guardaría enlaces de reunión sin
 * cifrar, o los cifraría con una clave improvisada. Por eso se prueba aquí y no
 * se deja al "ya fallará cuando alguien cree un aula".
 */

/** Entorno mínimo válido. Cada test le quita o le estropea una sola variable. */
function entornoValido(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    JWT_SECRET: 'un-secreto-de-mas-de-treinta-y-dos-caracteres',
    MEETING_LINK_KEY: 'a'.repeat(64),
    DATABASE_URL: 'postgresql://academia:academia@localhost:5432/academia',
    DIRECT_URL: 'postgresql://academia:academia@localhost:5432/academia',
    ...overrides,
  };
}

describe('validateEnv', () => {
  it('acepta el entorno mínimo y aplica los valores por defecto', () => {
    const env = validateEnv(entornoValido());

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.MEETING_LINK_KEY).toBe('a'.repeat(64));
  });

  // AC7 de la HU-201: sin la clave, la app no arranca Y el mensaje dice cuál
  // falta. Un error que solo dijera "configuración inválida" obligaría a leer el
  // esquema para averiguar qué se olvidó al desplegar.
  it('no arranca sin MEETING_LINK_KEY, y el mensaje la nombra', () => {
    const sinClave = entornoValido();
    delete sinClave.MEETING_LINK_KEY;

    expect(() => validateEnv(sinClave)).toThrow(/MEETING_LINK_KEY/);
    expect(() => validateEnv(sinClave)).toThrow(/FALTA/);
  });

  it('rechaza una MEETING_LINK_KEY que no sean 32 bytes en hexadecimal', () => {
    // Demasiado corta: 31 bytes. AES-256 necesita 32 exactos, y aceptarla
    // obligaría a derivar o rellenar la clave, escondiendo el error de
    // configuración detrás de un cifrado más débil de lo que su nombre promete.
    expect(() => validateEnv(entornoValido({ MEETING_LINK_KEY: 'a'.repeat(62) }))).toThrow(
      /MEETING_LINK_KEY/,
    );

    // Longitud correcta pero no es hexadecimal.
    expect(() => validateEnv(entornoValido({ MEETING_LINK_KEY: 'z'.repeat(64) }))).toThrow(
      /MEETING_LINK_KEY/,
    );
  });

  it('reporta TODAS las variables problemáticas a la vez, no solo la primera', () => {
    const roto = entornoValido();
    delete roto.JWT_SECRET;
    delete roto.MEETING_LINK_KEY;

    // Quien configura un despliegue las arregla de una pasada en vez de
    // descubrirlas de una en una, reiniciando entre cada intento.
    expect(() => validateEnv(roto)).toThrow(/JWT_SECRET[\s\S]*MEETING_LINK_KEY/);
  });
});
