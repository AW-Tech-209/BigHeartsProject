import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { LayoutAutenticacion } from './layout-autenticacion';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

describe('LayoutAutenticacion', () => {
  it('el skip-link es el primero enfocable y apunta al <main tabindex="-1">', async () => {
    const { user, container } = renderConProviders(
      <LayoutAutenticacion>
        <h1>Inicia sesión</h1>
      </LayoutAutenticacion>,
    );

    await user.tab();

    const skipLink = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(skipLink).toHaveFocus();

    const main = container.querySelector('main');
    expect(skipLink).toHaveAttribute('href', `#${main?.id}`);
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('no ofrece navegación: todavía no hay rol que mostrar', () => {
    renderConProviders(
      <LayoutAutenticacion>
        <h1>Inicia sesión</h1>
      </LayoutAutenticacion>,
    );

    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('muestra la marca y el sello de entorno', () => {
    renderConProviders(
      <LayoutAutenticacion>
        <h1>Inicia sesión</h1>
      </LayoutAutenticacion>,
    );

    expect(screen.getAllByText('BigHearts').length).toBeGreaterThan(0);
    expect(screen.getByText(/Entorno de pruebas · Fase 1/)).toBeInTheDocument();
  });

  it.each(TEMAS)('no tiene violaciones de accesibilidad en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <LayoutAutenticacion>
        <h1>Inicia sesión</h1>
      </LayoutAutenticacion>,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
