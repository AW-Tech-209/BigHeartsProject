import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { IndicadorCupo } from './indicador-cupo';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

describe('<IndicadorCupo /> — conteo literal, nunca porcentaje (AC7)', () => {
  it('muestra el conteo literal cuando hay cupos', () => {
    renderConProviders(<IndicadorCupo maxStudents={20} currentBookings={14} />);

    expect(screen.getByText('14 de 20 lugares ocupados · Quedan 6 cupos')).toBeInTheDocument();
    // Nunca un símbolo de porcentaje ni una fracción decimal.
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('con 0 cupos el texto cambia a "Sin cupos disponibles"', () => {
    renderConProviders(<IndicadorCupo maxStudents={10} currentBookings={10} />);

    expect(screen.getByText('Sin cupos disponibles')).toBeInTheDocument();
  });

  it('es un progressbar con los valores accesibles correctos', () => {
    renderConProviders(<IndicadorCupo maxStudents={20} currentBookings={14} />);

    const barra = screen.getByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuemin', '0');
    expect(barra).toHaveAttribute('aria-valuemax', '20');
    expect(barra).toHaveAttribute('aria-valuenow', '14');
    expect(barra).toHaveAttribute('aria-valuetext', 'Quedan 6 de 20 lugares');
  });

  it('con 0 cupos, aria-valuetext también lo dice sin números confusos', () => {
    renderConProviders(<IndicadorCupo maxStudents={10} currentBookings={10} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      'Sin cupos disponibles',
    );
  });
});

/**
 * La variante del profesor (HU-207, B3/AC8). Cuenta los mismos dos números al
 * revés: le importa cuánta gente viene, no cuánto queda.
 */
describe('<IndicadorCupo variante="inscritos" /> — la lectura del profesor (AC8)', () => {
  it('cuenta inscritos sobre cupo, y NO menciona los cupos disponibles', () => {
    renderConProviders(<IndicadorCupo variante="inscritos" maxStudents={10} currentBookings={3} />);

    expect(screen.getByText('3 de 10 inscritos')).toBeInTheDocument();
    expect(screen.queryByText(/quedan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lugares ocupados/i)).not.toBeInTheDocument();
  });

  it('un aula sin inscritos lo dice con el mismo formato, sin caso especial', () => {
    renderConProviders(<IndicadorCupo variante="inscritos" maxStudents={10} currentBookings={0} />);

    expect(screen.getByText('0 de 10 inscritos')).toBeInTheDocument();
  });

  it('el aula llena tampoco cambia de formato: es información, no una alarma', () => {
    renderConProviders(
      <IndicadorCupo variante="inscritos" maxStudents={10} currentBookings={10} />,
    );

    expect(screen.getByText('10 de 10 inscritos')).toBeInTheDocument();
    expect(screen.queryByText('Sin cupos disponibles')).not.toBeInTheDocument();
  });

  it('anuncia el conteo con su propia etiqueta, no con la del cupo', () => {
    renderConProviders(<IndicadorCupo variante="inscritos" maxStudents={10} currentBookings={3} />);

    const barra = screen.getByRole('progressbar', { name: 'Estudiantes inscritos' });
    expect(barra).toHaveAttribute('aria-valuenow', '3');
    expect(barra).toHaveAttribute('aria-valuemax', '10');
    expect(barra).toHaveAttribute('aria-valuetext', '3 de 10 inscritos');
  });
});

describe('<IndicadorCupo /> — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <IndicadorCupo maxStudents={20} currentBookings={14} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('la variante inscritos, sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <IndicadorCupo variante="inscritos" maxStudents={20} currentBookings={14} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
