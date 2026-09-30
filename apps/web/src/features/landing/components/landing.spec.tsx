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

  it('tiene un solo par de acceso, dentro de la barra', () => {
    renderConProviders(<Landing />);
    const barra = screen.getByRole('banner');

    const crear = screen.getAllByRole('link', { name: /crear/i });
    expect(crear).toHaveLength(1);
    expect(crear[0]).toHaveAttribute('href', '/registro');
    expect(barra).toContainElement(crear[0] as HTMLElement);

    const entrar = screen.getAllByRole('link', { name: /iniciar sesión/i });
    expect(entrar).toHaveLength(1);
    expect(entrar[0]).toHaveAttribute('href', '/login');
    expect(barra).toContainElement(entrar[0] as HTMLElement);
    expect(screen.queryByRole('textbox', { name: /correo/i })).not.toBeInTheDocument();
  });

  it('con sesión abierta ofrece el panel en vez del registro', () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<Landing />);

    expect(screen.getByRole('link', { name: /ir a mi panel/i })).toHaveAttribute('href', '/panel');
    expect(screen.queryByRole('link', { name: /crear/i })).not.toBeInTheDocument();
  });

  it('filtra el catálogo de ejemplo y actualiza el resumen', async () => {
    const { user } = renderConProviders(<Landing />);

    const antes = screen.getByText(RESUMEN).textContent;
    await user.selectOptions(screen.getByLabelText('Nivel'), 'ADVANCED');
    expect(screen.getByText(RESUMEN).textContent).not.toEqual(antes);

    await user.click(screen.getByRole('button', { name: /quitar filtros/i }));
    expect(screen.getByText(RESUMEN).textContent).toEqual(antes);
  });

  it('dice dónde ocurre la clase, antes de la sección de profesores', () => {
    renderConProviders(<Landing />);

    const comoEsUnaClase = screen.getByRole('heading', { name: /cuatro pasos/i });
    expect(screen.getByText(/^cómo es una clase$/i)).toBeInTheDocument();
    expect(screen.getByText(/zoom, meet o teams/i)).toBeInTheDocument();

    const profesores = screen.getByRole('heading', { name: /sabes quién viene/i });
    expect(
      comoEsUnaClase.compareDocumentPosition(profesores) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('destaca el estándar de LSC o intérprete de LSC', () => {
    renderConProviders(<Landing />);
    expect(
      screen.getByRole('heading', {
        name: /toda clase se imparte en.*lengua de señas colombiana/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/declara.*imparte/i)).toBeInTheDocument();
  });

  it('dice qué no es BigHearts', () => {
    renderConProviders(<Landing />);
    expect(screen.getByRole('heading', { name: /qué no es bighearts/i })).toBeInTheDocument();
  });

  it('no dice «lengua de signos» en ningún sitio', () => {
    const { container } = renderConProviders(<Landing />);
    expect(container.textContent).not.toMatch(/lengua de signos/i);
  });
});
