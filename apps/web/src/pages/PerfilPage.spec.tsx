import { ClassroomSupport, InstructionMode, UserRole } from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProfile } from '@/features/profile/api/get-profile';
import { updateProfile } from '@/features/profile/api/update-profile';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion, usuarioDePrueba } from '@/test/sesion';
import { PerfilPage } from './PerfilPage';

vi.mock('@/features/profile/api/get-profile', () => ({ getProfile: vi.fn() }));
vi.mock('@/features/profile/api/update-profile', () => ({ updateProfile: vi.fn() }));

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
      expect(
        screen.queryByLabelText('Modo de instrucción que prefieres', { exact: false }),
      ).toBeNull();
      expect(screen.queryByRole('group', { name: /apoyos que te sirven/i })).toBeNull();
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
      screen.getByLabelText('Modo de instrucción que prefieres', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /apoyos que te sirven/i })).toBeInTheDocument();
    expect(
      screen.getByText('Todavía no indicaste tus preferencias', { exact: false }),
    ).toBeInTheDocument();

    await esperarSinFallosDeAccesibilidad(container);
  });

  // D44: el estudiante puede preferir intérprete y declarar varios apoyos.
  it('un estudiante elige «con intérprete» y dos apoyos, y eso es lo que se envía', async () => {
    darSesion(UserRole.STUDENT);
    const estudiante = usuarioDePrueba(UserRole.STUDENT);
    vi.mocked(getProfile).mockResolvedValue({ user: estudiante });
    vi.mocked(updateProfile).mockResolvedValue({ user: estudiante });

    const { user } = renderConProviders(<PerfilPage />);

    await user.selectOptions(
      await screen.findByLabelText('Modo de instrucción que prefieres', { exact: false }),
      InstructionMode.INTERPRETE_LSC,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Lectura labial' }));
    await user.click(screen.getByRole('checkbox', { name: 'Subtítulos en vivo' }));
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateProfile).mock.calls[0]![0]).toMatchObject({
      preferredInstructionMode: InstructionMode.INTERPRETE_LSC,
      preferredSupports: [ClassroomSupport.LIP_READING, ClassroomSupport.LIVE_CAPTIONS],
    });
  });
});
