import { describe, expect, it } from 'vitest';

import { tiempoRelativo } from './tiempo-relativo';

const AHORA = new Date('2026-09-03T12:00:00.000Z');
const en = (ms: number) => new Date(AHORA.getTime() + ms).toISOString();

describe('tiempoRelativo', () => {
  it('resuelve minutos, horas y días con singular y plural', () => {
    expect(tiempoRelativo(en(60_000), AHORA)).toBe('En 1 minuto');
    expect(tiempoRelativo(en(25 * 60_000), AHORA)).toBe('En 25 minutos');
    expect(tiempoRelativo(en(60 * 60_000), AHORA)).toBe('En 1 hora');
    expect(tiempoRelativo(en(3 * 60 * 60_000), AHORA)).toBe('En 3 horas');
    expect(tiempoRelativo(en(3 * 24 * 60 * 60_000), AHORA)).toBe('En 3 días');
  });

  it('un instante ya pasado o inmediato es «Ahora»', () => {
    expect(tiempoRelativo(en(-1000), AHORA)).toBe('Ahora');
  });
});
