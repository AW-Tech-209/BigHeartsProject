import {
  CLASS_MAX_DURATION_MINUTES_DEFAULT,
  CLASS_MIN_LEAD_MINUTES_DEFAULT,
} from '@academia/types';
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

/**
 * HU-212. Los dos umbrales del eje temporal del aula son opcionales —traen
 * valor de fábrica— pero **no admiten cualquier valor**: uno de los dos tiene un
 * suelo que sale de otra regla del producto, y dejarlo pasar convertiría la
 * ventana de acceso al enlace en decorado.
 */
describe('validateEnv — coherencia temporal del aula', () => {
  it('trae los valores de fábrica: 60 minutos de antelación, 240 de duración', () => {
    const env = validateEnv(entornoValido());

    expect(env.CLASS_MIN_LEAD_MINUTES).toBe(CLASS_MIN_LEAD_MINUTES_DEFAULT);
    expect(env.CLASS_MAX_DURATION_MINUTES).toBe(CLASS_MAX_DURATION_MINUTES_DEFAULT);
  });

  it('los lee como números aunque el entorno los dé como texto', () => {
    const env = validateEnv(
      entornoValido({ CLASS_MIN_LEAD_MINUTES: '90', CLASS_MAX_DURATION_MINUTES: '120' }),
    );

    expect(env.CLASS_MIN_LEAD_MINUTES).toBe(90);
    expect(env.CLASS_MAX_DURATION_MINUTES).toBe(120);
  });

  // El suelo no es un número elegido a ojo: por debajo de la ventana de acceso
  // (30 min, §4.1) el enlace se revelaría en el mismo instante en que se publica
  // la clase. Un despliegue con 15 aquí no puede arrancar.
  it('no arranca con una antelación mínima por debajo de la ventana de acceso', () => {
    expect(() => validateEnv(entornoValido({ CLASS_MIN_LEAD_MINUTES: '15' }))).toThrow(
      /CLASS_MIN_LEAD_MINUTES/,
    );

    expect(
      validateEnv(entornoValido({ CLASS_MIN_LEAD_MINUTES: '30' })).CLASS_MIN_LEAD_MINUTES,
    ).toBe(30);
  });

  it('no arranca con una duración máxima de más de un día, ni con una negativa', () => {
    expect(() => validateEnv(entornoValido({ CLASS_MAX_DURATION_MINUTES: '1441' }))).toThrow(
      /CLASS_MAX_DURATION_MINUTES/,
    );
    expect(() => validateEnv(entornoValido({ CLASS_MAX_DURATION_MINUTES: '-10' }))).toThrow(
      /CLASS_MAX_DURATION_MINUTES/,
    );
  });
});

// HU-401 AC4: sin proveedor de email configurado, la app arranca igual con
// el adaptador de log. Con RESEND_API_KEY, EMAIL_FROM pasa a ser obligatoria.
describe('validateEnv — adaptador de email (D32)', () => {
  it('arranca sin RESEND_API_KEY ni EMAIL_FROM', () => {
    const env = validateEnv(entornoValido());

    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.EMAIL_FROM).toBeUndefined();
  });

  it('no arranca con RESEND_API_KEY sin EMAIL_FROM', () => {
    expect(() => validateEnv(entornoValido({ RESEND_API_KEY: 'un-secreto-de-resend' }))).toThrow(
      /EMAIL_FROM/,
    );
  });

  it('arranca con RESEND_API_KEY y EMAIL_FROM juntas', () => {
    const env = validateEnv(
      entornoValido({
        RESEND_API_KEY: 'un-secreto-de-resend',
        EMAIL_FROM: 'avisos@academia.local',
      }),
    );

    expect(env.RESEND_API_KEY).toBe('un-secreto-de-resend');
    expect(env.EMAIL_FROM).toBe('avisos@academia.local');
  });
});
