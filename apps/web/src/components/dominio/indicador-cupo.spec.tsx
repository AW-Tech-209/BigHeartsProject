import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { IndicadorCupo } from './indicador-cupo';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

describe('<IndicadorCupo /> — conteo literal, nunca porcentaje (AC7)', () => {
  it('muestra el conteo literal cuando hay cupos', () => {
    renderConProviders(<IndicadorCupo maxStudents={20} currentBookings={14} />);

    expect(screen.getByText('14 de 20 lugares ocupados · Quedan 6')).toBeInTheDocument();
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

describe('<IndicadorCupo /> — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <IndicadorCupo maxStudents={20} currentBookings={14} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
