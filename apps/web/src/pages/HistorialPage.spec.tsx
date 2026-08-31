import {
  BookingStatus,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getHistorial } from '@/features/historial/api/get-historial';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/historial/api/get-historial', () => ({ getHistorial: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function filaClasica() {
  return {
    id: 'aula-1',
    teacherId: 'profe-1',
    teacherFirstName: 'Paula',
    teacherLastName: 'Profesora',
    myBookingId: 'reserva-1',
    myBookingCancelable: null,
    accessState: 'sin-acceso' as const,
    accessOpensAt: null,
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: '2020-08-12T23:00:00.000Z',
    durationMinutes: 60,
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: '2020-08-01T10:00:00.000Z',
    updatedAt: '2020-08-01T10:00:00.000Z',
  };
}

function montar() {
  return renderConProviders(<AppRoutes />, { ruta: '/historial' });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HistorialPage — estudiante (AC1)', () => {
  beforeEach(() => darSesion(UserRole.STUDENT));

  it('muestra la clase pasada con su resultado', async () => {
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), myBookingStatus: BookingStatus.NO_SHOW }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    montar();

    expect(await screen.findByText('Conversación cotidiana')).toBeInTheDocument();
    expect(screen.getByText('No asististe')).toBeInTheDocument();
  });

  it('sin historial, explica el vacío sin sonar a error (AC5)', async () => {
    vi.mocked(getHistorial).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });

    montar();

    expect(await screen.findByText('Todavía no tienes clases pasadas')).toBeInTheDocument();
  });
});

describe('HistorialPage — profesor (AC2)', () => {
  beforeEach(() => darSesion(UserRole.TEACHER));

  it('muestra el aula impartida con inscritos y asistentes', async () => {
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), totalInscritos: 4, totalAsistieron: 3 }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    montar();

    expect(await screen.findByText('Conversación cotidiana')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('HistorialPage — no alcanzable para ADMIN (AC3)', () => {
  it('un ADMIN ve «Sin acceso», no el historial', () => {
    darSesion(UserRole.ADMIN);

    montar();

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Historial' })).toBeNull();
  });
});

describe('HistorialPage — accesibilidad (AC6)', () => {
  it.each(TEMAS)('sale limpia en el tema %s, con datos', async (tema) => {
    darSesion(UserRole.STUDENT);
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), myBookingStatus: BookingStatus.ATTENDED }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { container } = renderConProviders(<AppRoutes />, { ruta: '/historial', tema });

    await screen.findByText('Conversación cotidiana');
    await esperarSinFallosDeAccesibilidad(container);
  });
});
