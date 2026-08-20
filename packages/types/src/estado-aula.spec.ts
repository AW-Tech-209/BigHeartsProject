import { describe, expect, it } from 'vitest';

import { ClassroomStatus, UserStatus } from './index';
import {
  ACCESS_WINDOW_MINUTES_DEFAULT,
  derivarEstadoAula,
  type ParametrosDerivarEstadoAula,
  UMBRAL_ULTIMOS_CUPOS,
} from './estado-aula';

const AHORA = new Date('2026-08-20T12:00:00.000Z');

/** Aula futura "neutra": nada especial, para que cada test cambie un solo eje. */
function classroom(
  overrides: Partial<ParametrosDerivarEstadoAula['classroom']> = {},
): ParametrosDerivarEstadoAula['classroom'] {
  return {
    status: ClassroomStatus.PUBLISHED,
    currentBookings: 0,
    maxStudents: 10,
    scheduledAt: new Date(AHORA.getTime() + 2 * 60 * 60_000).toISOString(), // en 2 horas
    durationMinutes: 60,
    ...overrides,
  };
}

describe('derivarEstadoAula — los nueve estados, uno por uno', () => {
  it('pendiente-aprobacion: quien mira es el profesor dueño y su cuenta está PENDING', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom(),
        ahora: AHORA,
        estadoDelProfesorQueMira: UserStatus.PENDING,
      }),
    ).toBe('pendiente-aprobacion');
  });

  it('cancelada: Classroom.status = CANCELLED', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ status: ClassroomStatus.CANCELLED }),
        ahora: AHORA,
      }),
    ).toBe('cancelada');
  });

  it('finalizada: Classroom.status = COMPLETED', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ status: ClassroomStatus.COMPLETED }),
        ahora: AHORA,
      }),
    ).toBe('finalizada');
  });

  it('finalizada: now >= scheduledAt + durationMinutes, aunque el status siga PUBLISHED (D16)', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() - 90 * 60_000).toISOString(), // empezó hace 90 min
      durationMinutes: 60, // terminó hace 30 min
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA })).toBe('finalizada');
  });

  it('en-curso: scheduledAt <= now < scheduledAt + durationMinutes', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() - 10 * 60_000).toISOString(), // empezó hace 10 min
      durationMinutes: 60,
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA })).toBe('en-curso');
  });

  it('acceso-abierto: reserva CONFIRMED y now >= scheduledAt - ACCESS_WINDOW_MINUTES', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() + 10 * 60_000).toISOString(), // en 10 min, dentro de la ventana de 30
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA, tieneReservaConfirmada: true })).toBe(
      'acceso-abierto',
    );
  });

  it('reservada: reserva CONFIRMED pero todavía fuera de la ventana de acceso', () => {
    expect(
      derivarEstadoAula({ classroom: classroom(), ahora: AHORA, tieneReservaConfirmada: true }),
    ).toBe('reservada');
  });

  it('llena: currentBookings >= maxStudents', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ currentBookings: 10, maxStudents: 10 }),
        ahora: AHORA,
      }),
    ).toBe('llena');
  });

  it(`ultimos-cupos: quedan ${UMBRAL_ULTIMOS_CUPOS} cupos o menos`, () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ currentBookings: 7, maxStudents: 10 }), // quedan 3
        ahora: AHORA,
      }),
    ).toBe('ultimos-cupos');
  });

  it('disponible: cualquier otro caso', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ currentBookings: 2, maxStudents: 10 }), // quedan 8
        ahora: AHORA,
      }),
    ).toBe('disponible');
  });
});

describe('derivarEstadoAula — el orden es la especificación (primer match gana)', () => {
  it('CANCELLED con reserva CONFIRMED da cancelada, no reservada', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ status: ClassroomStatus.CANCELLED }),
        ahora: AHORA,
        tieneReservaConfirmada: true,
      }),
    ).toBe('cancelada');
  });

  it('finalizada con currentBookings >= maxStudents da finalizada, no llena', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() - 90 * 60_000).toISOString(),
      durationMinutes: 60,
      currentBookings: 10,
      maxStudents: 10,
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA })).toBe('finalizada');
  });

  it('en-curso con reserva CONFIRMED da en-curso, no acceso-abierto', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() - 10 * 60_000).toISOString(),
      durationMinutes: 60,
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA, tieneReservaConfirmada: true })).toBe(
      'en-curso',
    );
  });

  it('pendiente-aprobacion gana incluso sobre una aula cancelada', () => {
    expect(
      derivarEstadoAula({
        classroom: classroom({ status: ClassroomStatus.CANCELLED }),
        ahora: AHORA,
        estadoDelProfesorQueMira: UserStatus.PENDING,
      }),
    ).toBe('pendiente-aprobacion');
  });
});

describe('derivarEstadoAula — bordes de la ventana de acceso', () => {
  function aulaEnMinutos(minutos: number) {
    return classroom({ scheduledAt: new Date(AHORA.getTime() + minutos * 60_000).toISOString() });
  }

  it('en el instante exacto de apertura (now = scheduledAt - 30min), ya abrió', () => {
    expect(
      derivarEstadoAula({
        classroom: aulaEnMinutos(ACCESS_WINDOW_MINUTES_DEFAULT),
        ahora: AHORA,
        tieneReservaConfirmada: true,
      }),
    ).toBe('acceso-abierto');
  });

  it('un minuto antes de abrir, sigue reservada', () => {
    expect(
      derivarEstadoAula({
        classroom: aulaEnMinutos(ACCESS_WINDOW_MINUTES_DEFAULT + 1),
        ahora: AHORA,
        tieneReservaConfirmada: true,
      }),
    ).toBe('reservada');
  });

  it('un minuto después de abrir, sigue acceso-abierto', () => {
    expect(
      derivarEstadoAula({
        classroom: aulaEnMinutos(ACCESS_WINDOW_MINUTES_DEFAULT - 1),
        ahora: AHORA,
        tieneReservaConfirmada: true,
      }),
    ).toBe('acceso-abierto');
  });

  it('accessWindowMinutes es configurable (gancho de HU-303)', () => {
    expect(
      derivarEstadoAula({
        classroom: aulaEnMinutos(10),
        ahora: AHORA,
        tieneReservaConfirmada: true,
        accessWindowMinutes: 5,
      }),
    ).toBe('reservada');
  });
});

describe('derivarEstadoAula — bordes de en-curso / finalizada', () => {
  it('en el instante exacto de inicio, ya está en-curso', () => {
    const aula = classroom({ scheduledAt: AHORA.toISOString(), durationMinutes: 60 });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA })).toBe('en-curso');
  });

  it('en el instante exacto de fin, ya está finalizada', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() - 60 * 60_000).toISOString(),
      durationMinutes: 60,
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA })).toBe('finalizada');
  });

  it('un milisegundo antes de terminar, todavía en-curso', () => {
    const aula = classroom({
      scheduledAt: new Date(AHORA.getTime() - 60 * 60_000 + 1).toISOString(),
      durationMinutes: 60,
    });
    expect(derivarEstadoAula({ classroom: aula, ahora: AHORA })).toBe('en-curso');
  });
});
