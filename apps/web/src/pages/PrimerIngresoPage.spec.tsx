import { UserRole } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion, usuarioDePrueba } from '@/test/sesion';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('@/features/auth/api/cambiar-contrasena', () => ({
  cambiarContrasena: vi.fn(),
}));

function conBandera(role: UserRole) {
  const user = darSesion(role)!;
  useAuthStore.setState({ user: { ...user, debeCambiarContrasena: true } });
}

beforeEach(() => darSesion(null));

describe('primer ingreso', () => {
  it('con la bandera, /aulas redirige a /primer-ingreso', async () => {
    conBandera(UserRole.STUDENT);
    renderConProviders(<AppRoutes />, { ruta: '/aulas' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Crea tu contraseña' }),
    ).toBeVisible();
  });

  it('paso 1 sin fallos de accesibilidad', async () => {
    conBandera(UserRole.TEACHER);
    const { container } = renderConProviders(<AppRoutes />, { ruta: '/primer-ingreso' });

    await screen.findByRole('heading', { level: 1, name: 'Crea tu contraseña' });
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('el profesor no ve el paso 2 y el estudiante sí, sin fallos de accesibilidad', async () => {
    const { cambiarContrasena } = await import('@/features/auth/api/cambiar-contrasena');
    const sesion = (role: UserRole) => {
      const user = { ...usuarioDePrueba(role), debeCambiarContrasena: false };
      return { user, accessToken: 'nuevo', expiresIn: 900 };
    };

    conBandera(UserRole.TEACHER);
    vi.mocked(cambiarContrasena).mockResolvedValue(sesion(UserRole.TEACHER));
    const profesor = renderConProviders(<AppRoutes />, { ruta: '/primer-ingreso' });
    await rellenarYEnviar(profesor.user);
    expect(
      screen.queryByRole('heading', { name: '¿Cómo prefieres seguir las clases?' }),
    ).toBeNull();
    profesor.unmount();

    conBandera(UserRole.STUDENT);
    vi.mocked(cambiarContrasena).mockResolvedValue(sesion(UserRole.STUDENT));
    const estudiante = renderConProviders(<AppRoutes />, { ruta: '/primer-ingreso' });
    await rellenarYEnviar(estudiante.user);
    expect(
      await screen.findByRole('heading', { name: '¿Cómo prefieres seguir las clases?' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Lo haré después' })).toBeVisible();
    await esperarSinFallosDeAccesibilidad(estudiante.container);
  });
});

async function rellenarYEnviar(user: ReturnType<typeof renderConProviders>['user']) {
  await user.type(await screen.findByLabelText(/Contraseña temporal/), 'Temporal123');
  await user.type(screen.getByLabelText(/^Contraseña nueva/), 'Definitiva456');
  await user.type(screen.getByLabelText(/Repite la contraseña nueva/), 'Definitiva456');
  await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
}
