import {
  ApiErrorCode,
  type ClassroomDetail,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getClassroom } from '@/features/aulas/api/get-classroom';
import { getMisAulas } from '@/features/aulas/api/get-mis-aulas';
import { updateClassroom } from '@/features/aulas/api/update-classroom';
import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/aulas/api/get-classroom', () => ({ getClassroom: vi.fn() }));
vi.mock('@/features/aulas/api/get-mis-aulas', () => ({ getMisAulas: vi.fn() }));
vi.mock('@/features/aulas/api/update-classroom', () => ({
  updateClassroom: vi.fn(),
}));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];
const ID = 'aula-42';
const RUTA = `/mis-aulas/${ID}/accesibilidad`;
const PROFESOR_DUENO = 'user-teacher';

function aula(overrides: Partial<ClassroomDetail> = {}): ClassroomDetail {
  return {
    id: ID,
    teacherId: PROFESOR_DUENO,
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: '2099-08-12T23:00:00.000Z',
    durationMinutes: 60,
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

function montar(ruta: string = RUTA, tema: Tema = 'light') {
  return renderConProviders(<AppRoutes />, { ruta, tema });
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.TEACHER);
  vi.mocked(getMisAulas).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
});

describe('CompletarAccesibilidadPage — quién puede completar (T4)', () => {
  it('el dueño ve el formulario precargado con lo que ya declaró', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] }),
    });

    montar();

    expect(await screen.findByLabelText('Lengua de signos')).toBeChecked();
    expect(screen.getByLabelText('Lectura labial')).not.toBeChecked();
  });

  it('otro profesor NO ve el formulario: «Esta aula no es tuya»', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ teacherId: 'otro-profesor' }),
    });

    montar();

    expect(await screen.findByText('Esta aula no es tuya')).toBeInTheDocument();
    expect(screen.queryByLabelText('Lengua de signos')).not.toBeInTheDocument();
  });

  it('un id que no existe muestra el aviso de clase no encontrada', async () => {
    vi.mocked(getClassroom).mockRejectedValue(
      new ApiClientError(
        { code: ApiErrorCode.CLASSROOM_NOT_FOUND, message: 'No encontramos esta clase.' },
        404,
      ),
    );

    montar();

    expect(await screen.findByText('No encontramos esta clase')).toBeInTheDocument();
  });
});

describe('CompletarAccesibilidadPage — completar y guardar (AC1)', () => {
  beforeEach(() => {
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aula() });
  });

  it('sin elegir ningún modo, no envía y pinta el error bajo el grupo', async () => {
    const { user } = montar();
    await screen.findByLabelText('Lengua de signos');

    await user.click(screen.getByRole('button', { name: 'Guardar accesibilidad' }));

    expect(
      await screen.findByText('Elige al menos un modo en que se imparte la clase.'),
    ).toBeInTheDocument();
    expect(updateClassroom).not.toHaveBeenCalled();
  });

  it('elegir un modo y guardar llama al PATCH con los datos del formulario', async () => {
    vi.mocked(updateClassroom).mockResolvedValue({
      classroom: aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] }),
    });
    const { user } = montar();
    await screen.findByLabelText('Lengua de signos');

    await user.click(screen.getByLabelText('Lengua de signos'));
    await user.click(screen.getByRole('button', { name: 'Guardar accesibilidad' }));

    await waitFor(() => expect(updateClassroom).toHaveBeenCalledTimes(1));
    expect(updateClassroom).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] }),
    );
  });

  it('al guardar con éxito, vuelve a Mis aulas', async () => {
    vi.mocked(updateClassroom).mockResolvedValue({
      classroom: aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] }),
    });
    const { user } = montar();
    await screen.findByLabelText('Lengua de signos');

    await user.click(screen.getByLabelText('Lengua de signos'));
    await user.click(screen.getByRole('button', { name: 'Guardar accesibilidad' }));

    await screen.findByRole('heading', { level: 1, name: 'Mis aulas' });
  });
});

describe('CompletarAccesibilidadPage — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aula() });

    const { container } = montar(RUTA, tema);
    await screen.findByLabelText('Lengua de signos');

    await esperarSinFallosDeAccesibilidad(container);
  });
});
