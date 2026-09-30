import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { obtenerConfigPublica } from '@/features/auth/api/config-publica';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

vi.mock('@/features/auth/api/config-publica');

beforeEach(() => {
  darSesion(null);
});

describe('Registro cerrado', () => {
  beforeEach(() => {
    vi.mocked(obtenerConfigPublica).mockResolvedValue({ registroAbierto: false });
  });

  it('/registro muestra el aviso de fase de pruebas y no el formulario', async () => {
    const { container } = renderConProviders(<RegisterPage />);

    expect(await screen.findByText(/fase de pruebas/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('el login no enlaza a /registro', async () => {
    const { container } = renderConProviders(<LoginPage />);

    await screen.findByRole('heading', { level: 1 });
    await vi.waitFor(() => expect(obtenerConfigPublica).toHaveBeenCalled());
    expect(container.querySelector('a[href="/registro"]')).toBeNull();
  });
});

describe('Registro abierto', () => {
  it('el login enlaza a /registro y /registro muestra el formulario', async () => {
    vi.mocked(obtenerConfigPublica).mockResolvedValue({ registroAbierto: true });
    const login = renderConProviders(<LoginPage />);
    expect(await screen.findByRole('link', { name: 'Crea tu cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
    login.unmount();

    renderConProviders(<RegisterPage />);
    expect(await screen.findByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
  });
});
