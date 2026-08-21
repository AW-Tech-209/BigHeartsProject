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

/**
 * La perspectiva del profesor (HU-207, B3/AC8). La misma tarjeta responde otra
 * pregunta: no «¿me da tiempo a reservar?» sino «¿cuánta gente viene?».
 */
describe('<TarjetaAula perspectiva="profesor" /> — la vista del dueño (AC8)', () => {
  function tarjetaDelProfesor(overrides: Partial<ClassroomListItem> = {}) {
    return renderConProviders(
      <TarjetaAula classroom={aula(overrides)} perspectiva="profesor" ahora={AHORA} />,
    );
  }

  it('muestra inscritos sobre cupo', () => {
    tarjetaDelProfesor({ currentBookings: 3, maxStudents: 10 });

    expect(screen.getByText('3 de 10 inscritos')).toBeInTheDocument();
  });

  /**
   * El AC8 dice «no cupos disponibles», y el único estado cuyo texto los
   * menciona es `ultimos-cupos`. Con 8 de 10 ocupadas el catálogo diría «Quedan
   * 2 cupos»: aquí ese badge se calla y habla el conteo de inscritos, para que
   * la tarjeta no cuente lo mismo dos veces y al revés.
   */
  it('con pocos cupos libres no dice «Quedan N cupos»: dice cuántos vienen', () => {
    tarjetaDelProfesor({ currentBookings: 8, maxStudents: 10 });

    expect(screen.queryByText('Quedan 2 cupos')).not.toBeInTheDocument();
    expect(screen.getByText('8 de 10 inscritos')).toBeInTheDocument();
  });

  it('un aula llena tampoco muestra el badge de cupo', () => {
    tarjetaDelProfesor({ currentBookings: 10, maxStudents: 10 });

    expect(screen.queryByText('Sin cupos')).not.toBeInTheDocument();
    expect(screen.getByText('10 de 10 inscritos')).toBeInTheDocument();
  });

  /**
   * AC2: los estados de ciclo de vida SÍ conservan su badge, con color + ícono
   * + texto. No salen del cupo, y sin él la tarjeta no diría qué pasó.
   */
  it.each([
    [ClassroomStatus.CANCELLED, 'Clase cancelada'],
    [ClassroomStatus.COMPLETED, 'Clase finalizada'],
  ])('un aula %s conserva su badge de estado', (status, texto) => {
    tarjetaDelProfesor({ status });

    expect(screen.getByText(texto)).toBeInTheDocument();
    // Y sigue diciendo cuánta gente había: es su registro.
    expect(screen.getByText('2 de 10 inscritos')).toBeInTheDocument();
  });

  it('el riel sigue llevando el color del estado derivado', () => {
    const { container } = tarjetaDelProfesor({ status: ClassroomStatus.CANCELLED });

    expect(container.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-destructive');
  });

  // En «Mis aulas» el dueño es quien mira: su propio nombre en cada tarjeta es
  // ruido. En su lugar va la duración, que es lo que le falta para planificar.
  it('no repite el nombre del profesor; muestra nivel y duración', () => {
    tarjetaDelProfesor();

    expect(screen.queryByText(/Ana Restrepo/)).not.toBeInTheDocument();
    expect(screen.getByText('Intermedio · 1 hora')).toBeInTheDocument();
  });
});

describe('<TarjetaAula /> — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />, {
      tema,
    });

    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('la perspectiva del profesor, sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <TarjetaAula classroom={aula()} perspectiva="profesor" ahora={AHORA} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
