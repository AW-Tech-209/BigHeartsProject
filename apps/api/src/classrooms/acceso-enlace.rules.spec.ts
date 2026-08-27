import { ClassroomStatus } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { derivarAccesoAlEnlace } from './acceso-enlace.rules';

const AULA = {
  status: ClassroomStatus.PUBLISHED,
  scheduledAt: new Date('2027-01-01T18:00:00.000Z'),
  durationMinutes: 60,
};

describe('derivarAccesoAlEnlace', () => {
  it('un aula CANCELLED no da acceso a nadie, ni al dueño', () => {
    const resultado = derivarAccesoAlEnlace(
      { ...AULA, status: ClassroomStatus.CANCELLED },
      {
        esDueno: true,
        tieneReservaConfirmada: true,
        ahora: AULA.scheduledAt,
        accessWindowMinutes: 30,
      },
    );

    expect(resultado).toEqual({ estado: 'sin-acceso', abreEn: null });
  });

  it('el dueño lo ve siempre, incluso mucho antes de la ventana', () => {
    const resultado = derivarAccesoAlEnlace(AULA, {
      esDueno: true,
      tieneReservaConfirmada: false,
      ahora: new Date('2026-01-01T00:00:00.000Z'),
      accessWindowMinutes: 30,
    });

    expect(resultado).toEqual({ estado: 'abierto', abreEn: null });
  });

  it('sin reserva CONFIRMED, sin acceso, sea cual sea la hora', () => {
    const resultado = derivarAccesoAlEnlace(AULA, {
      esDueno: false,
      tieneReservaConfirmada: false,
      ahora: AULA.scheduledAt,
      accessWindowMinutes: 30,
    });

    expect(resultado).toEqual({ estado: 'sin-acceso', abreEn: null });
  });

  it('a 31 minutos del inicio, aún no', () => {
    const resultado = derivarAccesoAlEnlace(AULA, {
      esDueno: false,
      tieneReservaConfirmada: true,
      ahora: new Date(AULA.scheduledAt.getTime() - 31 * 60_000),
      accessWindowMinutes: 30,
    });

    expect(resultado.estado).toBe('aun-no');
    expect(resultado.abreEn).toEqual(new Date(AULA.scheduledAt.getTime() - 30 * 60_000));
  });

  it('a 29 minutos del inicio, abierto', () => {
    const resultado = derivarAccesoAlEnlace(AULA, {
      esDueno: false,
      tieneReservaConfirmada: true,
      ahora: new Date(AULA.scheduledAt.getTime() - 29 * 60_000),
      accessWindowMinutes: 30,
    });

    expect(resultado).toEqual({ estado: 'abierto', abreEn: null });
  });

  it('exactamente al final de la clase, ya sin acceso', () => {
    const fin = new Date(AULA.scheduledAt.getTime() + AULA.durationMinutes * 60_000);

    const resultado = derivarAccesoAlEnlace(AULA, {
      esDueno: false,
      tieneReservaConfirmada: true,
      ahora: fin,
      accessWindowMinutes: 30,
    });

    expect(resultado).toEqual({ estado: 'sin-acceso', abreEn: null });
  });

  it('usa el accessWindowMinutes configurado, no un valor fijo', () => {
    const resultado = derivarAccesoAlEnlace(AULA, {
      esDueno: false,
      tieneReservaConfirmada: true,
      ahora: new Date(AULA.scheduledAt.getTime() - 45 * 60_000),
      accessWindowMinutes: 60,
    });

    expect(resultado.estado).toBe('abierto');
  });
});
