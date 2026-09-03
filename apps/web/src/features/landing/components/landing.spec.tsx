import { UserRole } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { Landing } from './landing';

const RESUMEN = /clases? disponibles? con estos filtros|ninguna clase coincide con estos filtros/i;

describe('<Landing>', () => {
  beforeEach(() => {
    darSesion(null);
  });

  it('no tiene violaciones de accesibilidad en claro y en oscuro', async () => {
    const { container, unmount } = renderConProviders(<Landing />);
    await esperarSinFallosDeAccesibilidad(container);
    unmount();

    const oscuro = renderConProviders(<Landing />, { tema: 'dark' });
    await esperarSinFallosDeAccesibilidad(oscuro.container);
  });

  it('tiene un único <h1>', () => {
    renderConProviders(<Landing />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lleva a registro y a login desde el CTA, no a un formulario de correo', () => {
    renderConProviders(<Landing />);

    const crear = screen.getAllByRole('link', { name: /^crear una cuenta$/i });
    expect(crear.length).toBeGreaterThan(0);
    crear.forEach((enlace) => expect(enlace).toHaveAttribute('href', '/registro'));

    for (const enlace of screen.getAllByRole('link', { name: /iniciar sesión/i })) {
      expect(enlace).toHaveAttribute('href', '/login');
    }

    expect(screen.getByRole('link', { name: /crear mi cuenta de profesor/i })).toHaveAttribute(
      'href',
      '/registro',
    );
    expect(screen.queryByRole('textbox', { name: /correo/i })).not.toBeInTheDocument();
  });

  it('con sesión abierta ofrece el panel en vez del registro', () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<Landing />);

    expect(screen.getAllByRole('link', { name: /ir a mi panel/i })[0]).toHaveAttribute(
      'href',
      '/panel',
    );
    expect(screen.queryByRole('link', { name: /^crear una cuenta$/i })).not.toBeInTheDocument();
  });

  it('filtra el catálogo de ejemplo y actualiza el resumen', async () => {
    const { user } = renderConProviders(<Landing />);

    const antes = screen.getByText(RESUMEN).textContent;
    await user.selectOptions(screen.getByLabelText('Nivel'), 'ADVANCED');
    expect(screen.getByText(RESUMEN).textContent).not.toEqual(antes);

    await user.click(screen.getByRole('button', { name: /quitar filtros/i }));
    expect(screen.getByText(RESUMEN).textContent).toEqual(antes);
  });
});
