import {
  BookingStatus,
  type ClassroomListItem,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  type ResumenPanelResponse,
  UserRole,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { getResumenPanel } from '../api/get-resumen-panel';
import { ResumenPanel } from './resumen-panel';

vi.mock('../api/get-resumen-panel', () => ({ getResumenPanel: vi.fn() }));

function claseReservada(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'teacher-1',
    title: 'Conversación cotidiana',
    description: 'Saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 3,
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
    teacherFirstName: 'Paula',
    teacherLastName: 'Profesora',
    myBookingStatus: BookingStatus.CONFIRMED,
    myBookingId: 'r1',
    myBookingCancelable: true,
    accessState: 'sin-acceso',
    accessOpensAt: null,
    ...overrides,
  };
}

const dar = (resumen: ResumenPanelResponse) =>
  vi.mocked(getResumenPanel).mockResolvedValue(resumen);

beforeEach(() => vi.clearAllMocks());

describe('ResumenPanel — estudiante (AC1, AC5)', () => {
  it('pinta sus tres tarjetas con sus datos', async () => {
    dar({
      rol: UserRole.STUDENT,
      proximaClase: claseReservada(),
      reservasActivas: 2,
      clasesQueCoinciden: 4,
      sinPreferencia: false,
    });

    renderConProviders(<ResumenPanel />);

    expect(await screen.findByRole('heading', { name: 'Tu próxima clase' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Clases que coinciden contigo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tus reservas activas' })).toBeInTheDocument();
    expect(screen.getByText('clases con cupo coinciden con tu preferencia')).toBeInTheDocument();
  });

  it('con la cuenta vacía, cada cero explica qué significa y a dónde ir', async () => {
    dar({
      rol: UserRole.STUDENT,
      proximaClase: null,
      reservasActivas: 0,
      clasesQueCoinciden: 0,
      sinPreferencia: true,
    });

    renderConProviders(<ResumenPanel />);

    expect(await screen.findByText(/indica tu preferencia de comunicación/i)).toBeInTheDocument();
    expect(screen.getByText('No tienes ninguna clase reservada.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a mi perfil' })).toHaveAttribute('href', '/perfil');
  });
});

describe('ResumenPanel — profesor (AC4)', () => {
  const base = {
    rol: UserRole.TEACHER as const,
    proximaClase: null,
    comunicacionDelGrupo: { porModo: {}, sinIndicar: 0, total: 0 },
  };

  it('«Asistencia sin marcar» con deuda va en ámbar y enlaza a mis aulas', async () => {
    dar({ ...base, asistenciaSinMarcar: 2 });
    renderConProviders(<ResumenPanel />);

    expect(await screen.findByText('clases terminadas sin asistencia marcada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a mis aulas' })).toHaveAttribute(
      'href',
      '/mis-aulas',
    );
  });

  it('sin deuda, la misma tarjeta es una buena noticia', async () => {
    dar({ ...base, asistenciaSinMarcar: 0 });
    renderConProviders(<ResumenPanel />);

    expect(await screen.findByText('Nada pendiente de marcar.')).toBeInTheDocument();
  });

  it('«Cómo se comunica tu grupo» recuenta por modo', async () => {
    dar({
      ...base,
      asistenciaSinMarcar: 0,
      comunicacionDelGrupo: {
        porModo: { [CommunicationPreference.SIGN_LANGUAGE]: 3 },
        sinIndicar: 1,
        total: 4,
      },
    });
    renderConProviders(<ResumenPanel />);

    expect(await screen.findByText(/Lengua de signos · 3/)).toBeInTheDocument();
    expect(screen.getByText('Sin indicar · 1')).toBeInTheDocument();
  });
});

describe('ResumenPanel — admin (AC4)', () => {
  it('muestra la ocupación en conteo literal, sin porcentajes', async () => {
    dar({
      rol: UserRole.ADMIN,
      profesoresPendientes: 0,
      clasesHoy: 5,
      clasesEnCurso: 1,
      cuposReservadosSemana: 84,
      cuposOfrecidosSemana: 120,
    });

    const { container } = renderConProviders(<ResumenPanel />);

    expect(await screen.findByText('84 de 120')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%|por ciento/);
  });

  it('sale limpio de axe con datos', async () => {
    dar({
      rol: UserRole.ADMIN,
      profesoresPendientes: 3,
      clasesHoy: 5,
      clasesEnCurso: 1,
      cuposReservadosSemana: 84,
      cuposOfrecidosSemana: 120,
    });

    const { container } = renderConProviders(<ResumenPanel />);
    await screen.findByRole('heading', { name: 'Profesores pendientes de aprobar' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
