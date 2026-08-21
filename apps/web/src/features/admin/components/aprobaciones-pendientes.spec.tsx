import { UserRole, UserStatus, type User } from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPendingTeachers } from '@/features/admin/api/get-pending-teachers';
import { resolveTeacher } from '@/features/admin/api/resolve-teacher';
import { ApiClientError } from '@/lib/api-error';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { AprobacionesPendientes } from './aprobaciones-pendientes';

// Se mockea la frontera de red del feature, no axios: es donde acaba el dominio.
vi.mock('@/features/admin/api/get-pending-teachers', () => ({
  getPendingTeachers: vi.fn(),
}));
vi.mock('@/features/admin/api/resolve-teacher', () => ({ resolveTeacher: vi.fn() }));

function profesor(overrides: Partial<User> = {}): User {
  return {
    id: 'profe-1',
    email: 'paula@academia.local',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: UserRole.TEACHER,
    status: UserStatus.PENDING,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: '2026-08-12T15:30:00.000Z',
    updatedAt: '2026-08-12T15:30:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.ADMIN);
});

/** La región viva de `<LiveAnnouncerProvider>`. */
function regionViva() {
  return screen.getByRole('status');
}

describe('Aprobaciones pendientes — los cuatro estados (B6)', () => {
  it('cargando: lo dice con texto, no con un spinner mudo', () => {
    vi.mocked(getPendingTeachers).mockReturnValue(new Promise(() => undefined));

    renderConProviders(<AprobacionesPendientes />);

    expect(screen.getByText('Cargando los profesores pendientes…')).toBeInTheDocument();
  });

  it('vacío: invita a entender por qué no hay nada, sin lamentarlo', async () => {
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [] });

    renderConProviders(<AprobacionesPendientes />);

    expect(await screen.findByText('No hay profesores esperando aprobación.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('error: explica y ofrece volver a cargar', async () => {
    vi.mocked(getPendingTeachers).mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'No pudimos conectar.' }),
    );

    renderConProviders(<AprobacionesPendientes />);

    expect(await screen.findByText('No pudimos cargar la lista')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a cargar/i })).toBeInTheDocument();
  });

  it('éxito: pinta la tabla con quien espera', async () => {
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [profesor()] });

    renderConProviders(<AprobacionesPendientes />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('rowheader')).toHaveTextContent('Paula Profesora');
  });
});

describe('Aprobaciones pendientes — tras la acción (B5, AC7)', () => {
  it('aprobar anuncia el resultado por la región viva y recarga la lista', async () => {
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [profesor()] });
    vi.mocked(resolveTeacher).mockResolvedValue({
      user: profesor({ status: UserStatus.ACTIVE }),
    });

    const { user } = renderConProviders(<AprobacionesPendientes />);

    await user.click(await screen.findByRole('button', { name: 'Aprobar a Paula Profesora' }));
    await user.click(await screen.findByRole('button', { name: 'Aprobar profesor' }));

    // Solo el primer argumento: React Query pasa además su propio contexto de
    // mutación, que no es parte de nuestro contrato.
    expect(vi.mocked(resolveTeacher).mock.calls[0]?.[0]).toEqual({
      teacherId: 'profe-1',
      resolution: 'approve',
    });

    // La fila desaparece en silencio: el anuncio es lo único que se lo cuenta a
    // quien usa lector de pantalla.
    await waitFor(() =>
      expect(regionViva()).toHaveTextContent(
        'Aprobaste a Paula Profesora. Ya puede iniciar sesión.',
      ),
    );

    // Invalidar la query obliga a releer del servidor, no a creerle al cliente.
    await waitFor(() => expect(getPendingTeachers).toHaveBeenCalledTimes(2));
  });

  it('rechazar anuncia su propio resultado', async () => {
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [profesor()] });
    vi.mocked(resolveTeacher).mockResolvedValue({
      user: profesor({ status: UserStatus.REJECTED }),
    });

    const { user } = renderConProviders(<AprobacionesPendientes />);

    await user.click(await screen.findByRole('button', { name: 'Rechazar a Paula Profesora' }));
    await user.click(await screen.findByRole('button', { name: 'Rechazar profesor' }));

    expect(vi.mocked(resolveTeacher).mock.calls[0]?.[0]).toEqual({
      teacherId: 'profe-1',
      resolution: 'reject',
    });
    await waitFor(() =>
      expect(regionViva()).toHaveTextContent('Rechazaste la solicitud de Paula Profesora.'),
    );
  });

  /**
   * La carrera de dos administradores, vista desde la pantalla. Sin
   * actualización optimista la fila sigue ahí, que es la verdad: la decisión no
   * se aplicó.
   */
  it('si otro administrador llegó antes, se muestra el conflicto y la fila sigue en la tabla', async () => {
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [profesor()] });
    vi.mocked(resolveTeacher).mockRejectedValue(
      new ApiClientError(
        {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Esa cuenta ya no está pendiente de aprobación.',
        },
        409,
      ),
    );

    const { user } = renderConProviders(<AprobacionesPendientes />);

    await user.click(await screen.findByRole('button', { name: 'Aprobar a Paula Profesora' }));
    await user.click(await screen.findByRole('button', { name: 'Aprobar profesor' }));

    expect(await screen.findByText('No pudimos guardar tu decisión')).toBeInTheDocument();
    expect(screen.getByText('Esa cuenta ya no está pendiente de aprobación.')).toBeInTheDocument();
    expect(screen.getByRole('rowheader')).toHaveTextContent('Paula Profesora');
  });
});
