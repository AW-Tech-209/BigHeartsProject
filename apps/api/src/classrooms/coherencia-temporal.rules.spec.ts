import { describe, expect, it } from 'vitest';

import {
  excedeLaDuracionMaxima,
  finDelAula,
  minutosDeAntelacion,
  seSolapan,
  tienePocaAntelacion,
} from './coherencia-temporal.rules';

/**
 * El eje temporal de un aula, probado donde de verdad se decide: en las
 * funciones puras. El servicio elige el orden y traduce a códigos de error
 * (`classrooms.service.spec.ts`); lo que significa "solaparse" se decide aquí.
 *
 * Todos los instantes van en UTC explícito (§4.7): un `new Date('2026-09-01
 * 18:00')` sin zona se interpretaría en la del proceso, y el mismo test pasaría
 * o fallaría según dónde corra.
 */

/** Un aula de `duracion` minutos que empieza a la hora indicada, en UTC. */
function aula(hora: string, duracion = 60) {
  return { scheduledAt: new Date(`2026-09-01T${hora}:00.000Z`), durationMinutes: duracion };
}

describe('finDelAula', () => {
  it('suma la duración al inicio', () => {
    expect(finDelAula(aula('18:00', 90)).toISOString()).toBe('2026-09-01T19:30:00.000Z');
  });
});

describe('seSolapan', () => {
  // AC1: el caso que la HU pone por delante de todos.
  it('detecta el solapamiento parcial: 18:00–19:00 contra 18:30–19:30', () => {
    expect(seSolapan(aula('18:00'), aula('18:30'))).toBe(true);
  });

  it('detecta el solapamiento exacto: la misma hora y la misma duración', () => {
    expect(seSolapan(aula('18:00'), aula('18:00'))).toBe(true);
  });

  it('detecta una clase contenida entera dentro de otra', () => {
    expect(seSolapan(aula('18:00', 180), aula('19:00', 30))).toBe(true);
  });

  // AC2, y el borde que hace que la regla sea usable: dos clases seguidas son
  // el horario más normal que puede tener un profesor.
  it('NO solapa en el borde: una termina a las 19:00 y la otra empieza a las 19:00', () => {
    expect(seSolapan(aula('18:00'), aula('19:00'))).toBe(false);
    // Y al revés, porque la regla es simétrica.
    expect(seSolapan(aula('19:00'), aula('18:00'))).toBe(false);
  });

  it('NO solapa cuando ni siquiera se tocan', () => {
    expect(seSolapan(aula('18:00'), aula('21:00'))).toBe(false);
  });

  it('solapa por un solo minuto de cruce', () => {
    expect(seSolapan(aula('18:00'), aula('18:59'))).toBe(true);
  });

  it('da igual el orden de los argumentos', () => {
    expect(seSolapan(aula('18:00'), aula('18:30'))).toBe(seSolapan(aula('18:30'), aula('18:00')));
  });
});

describe('excedeLaDuracionMaxima', () => {
  it('rechaza por encima del máximo', () => {
    expect(excedeLaDuracionMaxima(241, 240)).toBe(true);
    expect(excedeLaDuracionMaxima(10_000, 240)).toBe(true);
  });

  // Un tope que rechazara su propio valor obligaría a explicar por qué 240 no
  // son 240.
  it('acepta exactamente el máximo', () => {
    expect(excedeLaDuracionMaxima(240, 240)).toBe(false);
  });
});

describe('minutosDeAntelacion', () => {
  it('cuenta los minutos que faltan contra el reloj que se le pasa', () => {
    const ahora = new Date('2026-09-01T17:00:00.000Z');

    expect(minutosDeAntelacion(new Date('2026-09-01T18:00:00.000Z'), ahora)).toBe(60);
  });

  // Trunca hacia abajo: redondear al alza dejaría pasar un caso que está por
  // debajo del mínimo.
  it('trunca hacia abajo los segundos sueltos', () => {
    const ahora = new Date('2026-09-01T17:00:01.000Z');

    expect(minutosDeAntelacion(new Date('2026-09-01T18:00:00.000Z'), ahora)).toBe(59);
  });

  it('es negativo si la clase ya empezó', () => {
    const ahora = new Date('2026-09-01T18:30:00.000Z');

    expect(minutosDeAntelacion(new Date('2026-09-01T18:00:00.000Z'), ahora)).toBe(-30);
  });
});

describe('tienePocaAntelacion', () => {
  const ahora = new Date('2026-09-01T17:00:00.000Z');

  it('avisa por debajo del mínimo', () => {
    expect(tienePocaAntelacion(new Date('2026-09-01T17:30:00.000Z'), ahora, 60)).toBe(true);
  });

  it('no avisa justo en el mínimo ni por encima', () => {
    expect(tienePocaAntelacion(new Date('2026-09-01T18:00:00.000Z'), ahora, 60)).toBe(false);
    expect(tienePocaAntelacion(new Date('2026-09-02T09:00:00.000Z'), ahora, 60)).toBe(false);
  });
});
