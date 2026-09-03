import { UserRole } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { useAuthStore } from '@/stores/auth-store';
import { CtaAcceso } from './cta-acceso';

beforeEach(() => {
  darSesion(null);
});

describe('CtaAcceso', () => {
  it('sin sesión muestra crear cuenta e iniciar sesión', () => {
    renderConProviders(<CtaAcceso />);

    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('mientras comprueba la sesión no enseña el par equivocado pero reserva el alto', () => {
    useAuthStore.setState({ status: 'checking', user: null, accessToken: null, endReason: 'none' });
    const { container } = renderConProviders(<CtaAcceso className="mt-9" />);

    expect(screen.queryByRole('link')).toBeNull();
    const hueco = container.querySelector('[aria-hidden="true"]');
    expect(hueco?.className).toContain('h-12');
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
