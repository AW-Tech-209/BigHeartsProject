import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

/**
 * Las dos pantallas de recuperación se montan sobre `<AppRoutes />`: una lee el
 * token de la query, y así se verifica de paso que las rutas están cableadas.
 */
vi.mock('@/features/auth/api/forgot-password', () => ({ forgotPassword: vi.fn() }));
vi.mock('@/features/auth/api/reset-password', () => ({ resetPassword: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(null);
});

describe('SolicitarRecuperacionPage — /recuperar-contrasena', () => {
  function montar(tema?: Tema) {
    return renderConProviders(<AppRoutes />, { ruta: '/recuperar-contrasena', tema });
  }

  it('tiene un <h1>, el foco entra en él y fija el título del documento', () => {
    montar();

    const h1 = screen.getByRole('heading', { level: 1, name: 'Recupera tu contraseña' });
    expect(h1).toHaveFocus();
    expect(document.title).toMatch(/Recuperar contraseña · BigHearts$/);
  });

  it('ofrece volver a iniciar sesión', () => {
    montar();

    expect(screen.getByRole('link', { name: 'Volver a iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it.each(TEMAS)('no tiene violaciones de accesibilidad en el tema %s', async (tema) => {
    const { container } = montar(tema);
    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('NuevaContrasenaPage — /nueva-contrasena', () => {
  function montar(ruta: string, tema?: Tema) {
    return renderConProviders(<AppRoutes />, { ruta, tema });
  }

  it('con token muestra el formulario y el <h1> recibe el foco', () => {
    montar('/nueva-contrasena?token=abc');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Crea una contraseña nueva' }),
    ).toHaveFocus();
    expect(screen.getByLabelText(/^Contraseña nueva/)).toBeInTheDocument();
  });

  it('sin token conserva el <h1> y enlaza a pedir uno nuevo', () => {
    montar('/nueva-contrasena');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Crea una contraseña nueva' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Falta el enlace de recuperación/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'pide uno nuevo' })).toHaveAttribute(
      'href',
      '/recuperar-contrasena',
    );
    expect(screen.queryByLabelText(/^Contraseña nueva/)).not.toBeInTheDocument();
  });

  it.each(TEMAS)(
    'no tiene violaciones de accesibilidad en el tema %s (con token)',
    async (tema) => {
      const { container } = montar('/nueva-contrasena?token=abc', tema);
      await esperarSinFallosDeAccesibilidad(container);
    },
  );
});
