import { UserRole } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProfile } from '@/features/profile/api/get-profile';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion, usuarioDePrueba } from '@/test/sesion';
import { PerfilPage } from './PerfilPage';

vi.mock('@/features/profile/api/get-profile', () => ({ getProfile: vi.fn() }));

/**
 * HU-504: los campos de accesibilidad y su aviso son solo del estudiante.
 */
describe('PerfilPage — accesibilidad es del estudiante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([UserRole.TEACHER, UserRole.ADMIN])(
    'un %s no ve el aviso ni los dos campos de accesibilidad (AC1)',
    async (role) => {
      darSesion(role);
      vi.mocked(getProfile).mockResolvedValue({ user: usuarioDePrueba(role) });

      const { container } = renderConProviders(<PerfilPage />);
      expect(await screen.findByLabelText('Nombre', { exact: false })).toBeInTheDocument();

      expect(screen.queryByText('Todavía no indicaste tus preferencias')).toBeNull();
      expect(screen.queryByLabelText('Nivel de hipoacusia', { exact: false })).toBeNull();
      expect(screen.queryByLabelText('Preferencia de comunicación', { exact: false })).toBeNull();
      expect(screen.getByLabelText('Apellidos', { exact: false })).toBeInTheDocument();

      await esperarSinFallosDeAccesibilidad(container);
    },
  );

  it('un estudiante ve y edita los dos campos igual que antes (AC2)', async () => {
    darSesion(UserRole.STUDENT);
    vi.mocked(getProfile).mockResolvedValue({ user: usuarioDePrueba(UserRole.STUDENT) });

    const { container } = renderConProviders(<PerfilPage />);

    expect(
      await screen.findByLabelText('Nivel de hipoacusia', { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Preferencia de comunicación', { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Todavía no indicaste tus preferencias', { exact: false }),
    ).toBeInTheDocument();

    await esperarSinFallosDeAccesibilidad(container);
  });
});
