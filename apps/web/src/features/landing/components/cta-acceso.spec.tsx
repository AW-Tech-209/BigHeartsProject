import { UserRole } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { useAuthStore } from '@/stores/auth-store';
import { obtenerConfigPublica } from '@/features/auth/api/config-publica';
import { CtaAcceso } from './cta-acceso';

vi.mock('@/features/auth/api/config-publica');

beforeEach(() => {
  darSesion(null);
  vi.mocked(obtenerConfigPublica).mockResolvedValue({ registroAbierto: true });
});

describe('CtaAcceso', () => {
  it('sin sesión y con el registro abierto muestra crear cuenta e iniciar sesión', async () => {
    renderConProviders(<CtaAcceso />);

    expect(await screen.findByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('con el registro cerrado muestra solo iniciar sesión', async () => {
    vi.mocked(obtenerConfigPublica).mockResolvedValue({ registroAbierto: false });
    renderConProviders(<CtaAcceso />);

    expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('mientras comprueba la sesión no enseña el par equivocado pero reserva el alto', () => {
    useAuthStore.setState({ status: 'checking', user: null, accessToken: null, endReason: 'none' });
    const { container } = renderConProviders(<CtaAcceso className="mt-9" />);

    expect(screen.queryByRole('link')).toBeNull();
    const hueco = container.querySelector('[aria-hidden="true"]');
    expect(hueco?.className).toContain('h-11');
    expect(hueco?.className).toContain('mt-9');
  });

  it('con sesión ofrece el panel', () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<CtaAcceso />);

    expect(screen.getByRole('link', { name: 'Ir a mi panel' })).toHaveAttribute('href', '/panel');
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderConProviders(<CtaAcceso />);
    await esperarSinFallosDeAccesibilidad(container);
  });
});
