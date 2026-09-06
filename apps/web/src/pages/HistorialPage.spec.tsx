import {
  type AulaImpartida,
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

  it('muestra el aula impartida con inscritos, asistentes y enlace al detalle', async () => {
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), totalInscritos: 4, totalAsistieron: 3, asistenciaPendiente: 0 }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    montar();

    expect(await screen.findByRole('link', { name: 'Conversación cotidiana' })).toHaveAttribute(
      'href',
      '/aulas/aula-1',
    );
    expect(screen.getByText('3 de 4 asistieron')).toBeInTheDocument();
    expect(screen.getByText('Asistencia marcada')).toBeInTheDocument();
  });

  it('avisa en la fila cuando no hay ninguna asistencia marcada', async () => {
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), totalInscritos: 4, totalAsistieron: 0, asistenciaPendiente: 4 }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    montar();

    expect(await screen.findByText('Falta marcar asistencia')).toBeInTheDocument();
    expect(screen.queryByText('0 de 4 asistieron')).toBeNull();
  });

  it('muestra el estado parcial cuando falta marcar solo a algunos', async () => {
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), totalInscritos: 5, totalAsistieron: 2, asistenciaPendiente: 2 }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    montar();

    expect(await screen.findByText('Falta marcar (2 de 5)')).toBeInTheDocument();
    expect(screen.queryByText('2 de 5 asistieron')).toBeNull();
  });

  it('sin el dato de pendientes no afirma que la asistencia esté marcada', async () => {
    vi.mocked(getHistorial).mockResolvedValue({
      // Simula una respuesta sin `asistenciaPendiente` (API sin recompilar).
      items: [
        { ...filaClasica(), totalInscritos: 3, totalAsistieron: 0 } as unknown as AulaImpartida,
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    montar();

    expect(await screen.findByText('Falta marcar asistencia')).toBeInTheDocument();
    expect(screen.queryByText('Asistencia marcada')).toBeNull();
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

  it.each(TEMAS)('el historial del profesor sale limpio en el tema %s', async (tema) => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getHistorial).mockResolvedValue({
      items: [{ ...filaClasica(), totalInscritos: 4, totalAsistieron: 2, asistenciaPendiente: 2 }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { container } = renderConProviders(<AppRoutes />, { ruta: '/historial', tema });

    await screen.findByText('Conversación cotidiana');
    await esperarSinFallosDeAccesibilidad(container);
  });
});
