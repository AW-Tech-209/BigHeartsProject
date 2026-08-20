import {
  type ClassroomListItem,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { TarjetaAula } from './tarjeta-aula';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];
const AHORA = new Date('2026-08-20T12:00:00.000Z');

function aula(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'profe-1',
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: new Date(AHORA.getTime() + 2 * 60 * 60_000).toISOString(),
    durationMinutes: 60,
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    teacherFirstName: 'Ana',
    teacherLastName: 'Restrepo',
    ...overrides,
  };
}

describe('<TarjetaAula /> — anatomía (layout-y-composicion.md)', () => {
  it('el nombre accesible de la tarjeta es el título, no la fecha', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.getByRole('article', { name: 'Conversación cotidiana' })).toBeInTheDocument();
  });

  it('la fecha aparece ANTES que el título en el DOM', () => {
    const { container } = renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    const textos = Array.from(container.querySelectorAll('p, h3')).map((el) => el.textContent);
    // El año siempre aparece en `describirHorario()`; es un texto que solo
    // puede ser la línea de fecha, sin depender de la zona horaria del runner.
    const indiceFecha = textos.findIndex((t) => t?.includes('2026'));
    const indiceTitulo = textos.indexOf('Conversación cotidiana');

    expect(indiceFecha).toBeGreaterThanOrEqual(0);
    expect(indiceFecha).toBeLessThan(indiceTitulo);
  });

  it('muestra el nombre del profesor y el nivel', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.getByText('Ana Restrepo · Intermedio')).toBeInTheDocument();
  });

  it('lleva el riel de 4px con el color del estado derivado', () => {
    const { container } = renderConProviders(
      // 3 de 10 ocupadas: quedan 7, > umbral de últimos cupos → disponible.
      <TarjetaAula classroom={aula({ currentBookings: 3 })} ahora={AHORA} />,
    );

    const riel = container.querySelector('span[aria-hidden="true"]');
    expect(riel).toHaveClass('bg-success');
  });

  it('muestra el badge de estado con el texto correspondiente', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ currentBookings: 8, maxStudents: 10 })} ahora={AHORA} />,
    );

    expect(screen.getByText('Quedan 2 cupos')).toBeInTheDocument();
  });
});

describe('<TarjetaAula /> — el estado se deriva, no se reimplementa (B3, AC5)', () => {
  it('un aula CANCELLED se pinta como cancelada, aunque tenga cupo libre', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ status: ClassroomStatus.CANCELLED })} ahora={AHORA} />,
    );

    expect(screen.getByText('Clase cancelada')).toBeInTheDocument();
  });

  it('un aula llena se pinta como llena', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ currentBookings: 10, maxStudents: 10 })} ahora={AHORA} />,
    );

    expect(screen.getByText('Sin cupos')).toBeInTheDocument();
  });
});

describe('<TarjetaAula /> — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />, {
      tema,
    });

    await esperarSinFallosDeAccesibilidad(container);
  });
});
