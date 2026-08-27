import {
  ApiErrorCode,
  type ClassroomDetail,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getClassroom } from '@/features/aulas/api/get-classroom';
import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/aulas/api/get-classroom', () => ({ getClassroom: vi.fn() }));

const ID_ORIGEN = 'aula-origen';
const PROFESOR_DUENO = 'user-teacher';

function aulaOrigen(overrides: Partial<ClassroomDetail> = {}): ClassroomDetail {
  return {
    id: ID_ORIGEN,
    teacherId: PROFESOR_DUENO,
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: '2027-08-12T23:00:00.000Z',
    durationMinutes: 90,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    teacherFirstName: 'Ana',
    teacherLastName: 'Restrepo',
    myBookingStatus: null,
    myBookingId: null,
    myBookingCancelable: null,
    ...overrides,
  };
}

function montar(ruta: string) {
  return renderConProviders(<AppRoutes />, { ruta });
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.TEACHER);
});

describe('CrearAulaPage — duplicar (AC1, AC3, AC4)', () => {
  it('precarga el formulario y titula con el aula de origen', async () => {
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aulaOrigen() });
    montar(`/mis-aulas/nueva?desde=${ID_ORIGEN}`);

    await screen.findByRole('heading', { level: 1, name: 'Duplicar «Conversación cotidiana»' });
    expect(screen.getByLabelText(/nombre de la clase/i)).toHaveValue('Conversación cotidiana');
    expect(screen.getByLabelText(/enlace de la reunión/i)).toHaveValue(
      'https://meet.google.com/abc-defg-hij',
    );
  });

  it('el foco entra en el campo de fecha, no en el <h1>', async () => {
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aulaOrigen() });
    montar(`/mis-aulas/nueva?desde=${ID_ORIGEN}`);

    await waitFor(() => expect(screen.getByLabelText(/^día/i)).toHaveFocus());
  });
});

describe('CrearAulaPage — origen inexistente o ajeno (T5, AC7)', () => {
  it('un id inexistente cae al formulario vacío con un aviso, no a un error', async () => {
    vi.mocked(getClassroom).mockRejectedValue(
      new ApiClientError(
        { code: ApiErrorCode.CLASSROOM_NOT_FOUND, message: 'No encontramos esta clase.' },
        404,
      ),
    );
    montar('/mis-aulas/nueva?desde=no-existe');

    await screen.findByRole('heading', { level: 1, name: 'Crear una clase' });
    expect(screen.getByText(/no encontramos esa clase para duplicarla/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de la clase/i)).toHaveValue('');
  });

  it('un id de otro profesor no precarga nada', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aulaOrigen({ teacherId: 'otro-profesor' }),
    });
    montar(`/mis-aulas/nueva?desde=${ID_ORIGEN}`);

    await screen.findByRole('heading', { level: 1, name: 'Crear una clase' });
    expect(screen.getByText(/no encontramos esa clase para duplicarla/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de la clase/i)).toHaveValue('');
  });
});

describe('CrearAulaPage — accesibilidad', () => {
  it('sin fallos de axe al caer al formulario vacío con aviso', async () => {
    vi.mocked(getClassroom).mockRejectedValue(
      new ApiClientError(
        { code: ApiErrorCode.CLASSROOM_NOT_FOUND, message: 'No encontramos esta clase.' },
        404,
      ),
    );
    const { container } = montar('/mis-aulas/nueva?desde=no-existe');

    await screen.findByText(/no encontramos esa clase para duplicarla/i);
    await esperarSinFallosDeAccesibilidad(container);
  });
});
