import {
  BookingStatus,
  type ClassroomListItem,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  EstadoTemporalAula,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMisReservas } from '@/features/aulas/api/get-mis-reservas';
import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { MisClasesPage } from './MisClasesPage';

vi.mock('@/features/aulas/api/get-mis-reservas', () => ({ getMisReservas: vi.fn() }));
vi.mock('@/features/aulas/api/cancel-booking', () => ({ cancelBooking: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function claseReservada(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'user-teacher',
    teacherFirstName: 'Paula',
    teacherLastName: 'Profesora',
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
    myBookingStatus: BookingStatus.CONFIRMED,
    myBookingId: 'reserva-1',
    myBookingCancelable: true,
    ...overrides,
  };
}

function respuesta(
  items: ClassroomListItem[],
  overrides: Partial<{ total: number; page: number; pageSize: number }> = {},
) {
  return { items, total: items.length, page: 1, pageSize: 20, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.STUDENT);
});

describe('MisClasesPage — los cuatro estados', () => {
  it('cargando: lo dice con texto, no con un spinner mudo', () => {
    vi.mocked(getMisReservas).mockReturnValue(new Promise(() => undefined));

    renderConProviders(<MisClasesPage />);

    expect(screen.getByText('Cargando tus clases…')).toBeInTheDocument();
  });

  // AC5: sin reservas, la pantalla explica cómo conseguir una y enlaza al catálogo.
  it('vacío sin filtro: enlaza al catálogo', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisClasesPage />);

    expect(await screen.findByText('Todavía no tienes clases reservadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar las aulas' })).toHaveAttribute(
      'href',
      '/aulas',
    );
  });

  it('vacío con filtro: la salida es volver a verlas todas', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisClasesPage />, { ruta: '/mis-clases?estado=canceladas' });

    expect(await screen.findByText('No tienes clases en este estado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver todas mis clases' })).toBeInTheDocument();
  });

  it('error: explica y ofrece volver a cargar', async () => {
    vi.mocked(getMisReservas).mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'No pudimos conectar.' }),
    );

    renderConProviders(<MisClasesPage />);

    expect(await screen.findByText('No pudimos cargar tus clases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a cargar/i })).toBeInTheDocument();
  });
});

describe('MisClasesPage — el listado del estudiante (AC1)', () => {
  it('un estudiante con reservas las ve todas, con el profesor y el estado', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(
      respuesta([
        claseReservada({ id: '1', title: 'Conversación cotidiana' }),
        claseReservada({ id: '2', title: 'Inglés de negocios' }),
      ]),
    );

    renderConProviders(<MisClasesPage />);

    const tarjeta = await screen.findByRole('article', { name: 'Conversación cotidiana' });
    expect(within(tarjeta).getByText(/Paula Profesora/)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Inglés de negocios' })).toBeInTheDocument();
  });

  // AC2: una clase cancelada del mes que viene aparece con su propio estado.
  it('una clase cancelada se muestra como cancelada, no como próxima', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(
      respuesta([
        claseReservada({
          id: 'cancelada',
          title: 'Clase cancelada de agosto',
          status: ClassroomStatus.CANCELLED,
        }),
      ]),
    );

    renderConProviders(<MisClasesPage />);

    const tarjeta = await screen.findByRole('article', { name: 'Clase cancelada de agosto' });
    expect(within(tarjeta).getByText('Clase cancelada')).toBeInTheDocument();
  });

  // No es el catálogo: aquí no hay botón de reservar, la clase ya está confirmada.
  it('no ofrece reservar sobre una clase ya reservada', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta([claseReservada()]));

    renderConProviders(<MisClasesPage />);

    await screen.findByRole('article');
    expect(screen.queryByRole('button', { name: /reservar/i })).toBeNull();
  });
});

describe('MisClasesPage — cancelar una reserva (HU-303, T6/T7)', () => {
  it('dentro de la ventana, ofrece cancelar y confirma antes de hacerlo', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta([claseReservada()]));
    const { user } = renderConProviders(<MisClasesPage />);

    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));

    expect(
      screen.getByRole('heading', { name: '¿Cancelar tu reserva en «Conversación cotidiana»?' }),
    ).toBeInTheDocument();
  });

  // AC5: pasada la ventana, no hay botón muerto — se explica por qué.
  it('pasada la ventana, no ofrece cancelar y explica por qué', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(
      respuesta([claseReservada({ myBookingCancelable: false })]),
    );
    renderConProviders(<MisClasesPage />);

    expect(await screen.findByText('Ya no se puede cancelar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
  });
});

describe('MisClasesPage — filtro temporal en la URL (AC2)', () => {
  it('una URL con filtro deja el control marcado y pide ese estado', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisClasesPage />, { ruta: '/mis-clases?estado=pasadas' });
    await screen.findByText('No tienes clases en este estado');

    expect(screen.getByLabelText('Estado')).toHaveValue(EstadoTemporalAula.PASADAS);
    expect(vi.mocked(getMisReservas).mock.calls[0]?.[0]).toEqual({
      estado: EstadoTemporalAula.PASADAS,
    });
  });

  it('quitar el filtro desde el vacío vuelve a pedirlas todas', async () => {
    vi.mocked(getMisReservas).mockResolvedValue(respuesta([]));
    const { user } = renderConProviders(<MisClasesPage />, {
      ruta: '/mis-clases?estado=canceladas',
    });

    await user.click(await screen.findByRole('button', { name: 'Ver todas mis clases' }));

    await waitFor(() => expect(vi.mocked(getMisReservas).mock.calls.at(-1)?.[0]).toEqual({}));
  });
});

describe('MisClasesPage — accesibilidad con datos (AC6)', () => {
  it.each(TEMAS)('sale limpia en el tema %s', async (tema) => {
    vi.mocked(getMisReservas).mockResolvedValue(
      respuesta([
        claseReservada(),
        claseReservada({
          id: 'aula-2',
          title: 'Inglés de negocios',
          status: ClassroomStatus.CANCELLED,
          communicationModes: [CommunicationPreference.SIGN_LANGUAGE],
        }),
      ]),
    );

    const { container } = renderConProviders(<MisClasesPage />, { tema });

    await screen.findByRole('article', { name: 'Conversación cotidiana' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
