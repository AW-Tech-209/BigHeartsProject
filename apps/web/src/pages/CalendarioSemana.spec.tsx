import {
  BookingStatus,
  type ClassroomListItem,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMisAulas } from '@/features/aulas/api/get-mis-aulas';
import { getMisReservas } from '@/features/aulas/api/get-mis-reservas';
import { agruparPorDia, rangoDeSemana } from '@/features/calendario/lib/semana';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { MisAulasPage } from './MisAulasPage';
import { MisClasesPage } from './MisClasesPage';

vi.mock('@/features/aulas/api/get-mis-reservas', () => ({ getMisReservas: vi.fn() }));
vi.mock('@/features/aulas/api/get-mis-aulas', () => ({ getMisAulas: vi.fn() }));
vi.mock('@/features/aulas/api/cancel-booking', () => ({ cancelBooking: vi.fn() }));

// 29 sep 2026 00:30 UTC = lunes 28 sep, 7:30 p. m. en Colombia.
const MADRUGADA_UTC = '2026-09-29T00:30:00.000Z';
const SEMANA = '/?vista=semana&semana=2026-09-28';

beforeAll(() => {
  process.env.TZ = 'America/Bogota';
});

function clase(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'user-teacher',
    teacherFirstName: 'Paula',
    teacherLastName: 'Profesora',
    title: 'Conversación cotidiana',
    description: 'Saludos.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: MADRUGADA_UTC,
    durationMinutes: 60,
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    instructionMode: null,
    supports: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    myBookingStatus: BookingStatus.CONFIRMED,
    myBookingId: 'reserva-1',
    myBookingCancelable: true,
    accessState: 'sin-acceso',
    accessOpensAt: null,
    ...overrides,
  };
}

const respuesta = (items: ClassroomListItem[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: items.length,
});

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.STUDENT);
  vi.mocked(getMisReservas).mockResolvedValue(respuesta([clase()]));
});

afterEach(() => vi.unstubAllGlobals());

describe('semana — funciones puras (AC2)', () => {
  it('una clase a las 00:30 UTC del martes cae el lunes en hora de Colombia', () => {
    const porDia = agruparPorDia([clase()]);
    expect([...porDia.keys()]).toEqual(['2026-09-28']);
  });

  it('el rango va de un lunes local al siguiente, en UTC', () => {
    expect(rangoDeSemana('2026-09-28')).toEqual({
      desde: '2026-09-28T05:00:00.000Z',
      hasta: '2026-10-05T05:00:00.000Z',
    });
  });
});

describe('Vista Semana', () => {
  it('por defecto sigue la lista: no hay calendario', async () => {
    renderConProviders(<MisClasesPage />);

    expect(await screen.findByRole('heading', { name: 'Tus clases' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Semana siguiente' })).toBeNull();
  });

  it('cada clase es un enlace con día, hora y título en su nombre (AC2, AC3)', async () => {
    renderConProviders(<MisClasesPage />, { ruta: SEMANA });

    const enlace = await screen.findByRole('link', {
      name: /Lunes,? 28 de septiembre.*7:30\s+p\.\s*m\..*Conversación cotidiana/,
    });
    expect(enlace).toHaveAttribute('href', '/aulas/aula-1');
    expect(getMisReservas).toHaveBeenCalledWith({
      desde: '2026-09-28T05:00:00.000Z',
      hasta: '2026-10-05T05:00:00.000Z',
    });
  });

  it('navegar cambia la semana y la consulta', async () => {
    const { user } = renderConProviders(<MisClasesPage />, { ruta: SEMANA });
    await screen.findByRole('link', { name: /Conversación cotidiana/ });

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));

    expect(await screen.findByRole('heading', { name: /5 oct.*11 oct/ })).toBeInTheDocument();
    expect(getMisReservas).toHaveBeenLastCalledWith({
      desde: '2026-10-05T05:00:00.000Z',
      hasta: '2026-10-12T05:00:00.000Z',
    });
  });

  it('el profesor ve su semana en «Mis aulas»', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([clase({ myBookingStatus: null })]));

    renderConProviders(<MisAulasPage />, { ruta: SEMANA });

    expect(await screen.findByRole('link', { name: /Conversación cotidiana/ })).toBeInTheDocument();
    expect(getMisAulas).toHaveBeenCalledWith(
      expect.objectContaining({ desde: expect.any(String) }),
    );
  });

  it('en móvil se ve la agenda con los días vacíos plegados (AC5)', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    renderConProviders(<MisClasesPage />, { ruta: SEMANA });

    await screen.findByRole('link', { name: /Conversación cotidiana/ });
    expect(screen.getByText('Sin clases (6 días)')).toBeInTheDocument();
  });

  it('axe limpio', async () => {
    const { container } = renderConProviders(<MisClasesPage />, { ruta: SEMANA });
    await screen.findByRole('link', { name: /Conversación cotidiana/ });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
