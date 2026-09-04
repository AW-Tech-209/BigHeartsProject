import type { EstadoAula as EstadoAulaTipo } from '@academia/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { EstadoAula, textoEstadoAula } from './estado-aula';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

describe('textoEstadoAula — el texto exacto de patrones-dominio.md', () => {
  it.each([
    ['disponible', undefined, 'Hay cupo'],
    ['ultimos-cupos', 3, 'Quedan 3 cupos'],
    ['ultimos-cupos', 1, 'Queda 1 cupo'],
    ['llena', undefined, 'Sin cupos'],
    ['reservada', undefined, 'Tienes tu cupo'],
    ['acceso-abierto', undefined, 'Ya puedes entrar'],
    ['en-curso', undefined, 'Clase en curso'],
    ['finalizada', undefined, 'Clase finalizada'],
    ['cancelada', undefined, 'Clase cancelada'],
    ['pendiente-aprobacion', undefined, 'Pendiente de aprobación'],
  ] satisfies [EstadoAulaTipo, number | undefined, string][])(
    '%s → %s',
    (estado, cuposRestantes, esperado) => {
      expect(textoEstadoAula(estado, cuposRestantes)).toBe(esperado);
    },
  );
});

describe('<EstadoAula /> — codificación triple (color + ícono + texto)', () => {
  it('pinta el texto visible del estado', () => {
    renderConProviders(<EstadoAula estado="disponible" />);
    expect(screen.getByText('Hay cupo')).toBeInTheDocument();
  });

  it('el número de cupos restantes aparece en el texto de ultimos-cupos', () => {
    renderConProviders(<EstadoAula estado="ultimos-cupos" cuposRestantes={2} />);
    expect(screen.getByText('Quedan 2 cupos')).toBeInTheDocument();
  });

  it('el ícono es decorativo: el texto ya nombra el estado, aria-hidden evita duplicar el anuncio', () => {
    const { container } = renderConProviders(<EstadoAula estado="llena" />);
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });
});

describe('<EstadoAula /> — accesibilidad automática', () => {
  const ESTADOS: EstadoAulaTipo[] = [
    'disponible',
    'ultimos-cupos',
    'llena',
    'reservada',
    'acceso-abierto',
    'en-curso',
    'finalizada',
    'cancelada',
    'pendiente-aprobacion',
  ];

  it.each(TEMAS)('sin violaciones en el tema %s, en los nueve estados', async (tema) => {
    const { container } = renderConProviders(
      <div>
        {ESTADOS.map((estado) => (
          <EstadoAula key={estado} estado={estado} cuposRestantes={3} />
        ))}
      </div>,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
