import {
  type ClassroomListItem,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getAdminClassrooms } from '@/features/admin/api/get-admin-classrooms';
import { getTeachers } from '@/features/admin/api/get-teachers';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/admin/api/get-admin-classrooms', () => ({ getAdminClassrooms: vi.fn() }));
vi.mock('@/features/admin/api/get-teachers', () => ({ getTeachers: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function aula(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'profe-1',
    teacherFirstName: 'Paula',
    teacherLastName: 'Profesora',
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
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

function respuesta(
  items: ClassroomListItem[],
  overrides: Partial<{ total: number; page: number; pageSize: number }> = {},
) {
  return { items, total: items.length, page: 1, pageSize: 20, ...overrides };
}

function montar(ruta = '/admin/aulas') {
  return renderConProviders(<AppRoutes />, { ruta });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTeachers).mockResolvedValue({ teachers: [] });
});

/**
 * T12/AC3 — la pantalla no es alcanzable para roles que no son ADMIN. Se
 * comprueba de punta a punta sobre `<AppRoutes>`, con el `<RequireAuth>` real:
 * quien decide el permiso de verdad es el servidor (`GET /admin/classrooms`
 * responde 403), esto solo evita ofrecer una pantalla que acabaría ahí.
 */
describe('SupervisionAulasPage — no alcanzable fuera de ADMIN (T12)', () => {
  it.each([UserRole.STUDENT, UserRole.TEACHER])('%s ve «Sin acceso», no la supervisión', (rol) => {
    darSesion(rol);
    montar();

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Supervisión de aulas' })).toBeNull();
  });

  it('un ADMIN sí entra a la pantalla', async () => {
    darSesion(UserRole.ADMIN);
    vi.mocked(getAdminClassrooms).mockResolvedValue(respuesta([]));

    montar();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Supervisión de aulas' }),
    ).toBeInTheDocument();
  });
});

describe('SupervisionAulasPage — el listado (AC1, AC2)', () => {
  beforeEach(() => darSesion(UserRole.ADMIN));

  it('muestra aulas de al menos dos profesores distintos (AC1)', async () => {
    vi.mocked(getAdminClassrooms).mockResolvedValue(
      respuesta([
        aula({ id: 'aula-1', teacherId: 'profe-1', teacherFirstName: 'Paula' }),
        aula({ id: 'aula-2', teacherId: 'profe-2', teacherFirstName: 'Marco' }),
      ]),
    );

    montar();

    expect(await screen.findByText('Paula Profesora')).toBeInTheDocument();
    expect(screen.getByText('Marco Profesora')).toBeInTheDocument();
  });

  it('muestra canceladas y pasadas, cada una con su estado (AC2)', async () => {
    vi.mocked(getAdminClassrooms).mockResolvedValue(
      respuesta([
        aula({ id: 'cancelada', title: 'Título cancelado', status: ClassroomStatus.CANCELLED }),
        aula({ id: 'pasada', title: 'Título pasado', scheduledAt: '2020-01-01T00:00:00.000Z' }),
      ]),
    );

    montar();

    await screen.findByText('Título cancelado');
    expect(screen.getAllByText('Clase cancelada')).toHaveLength(1);
    expect(screen.getAllByText('Clase finalizada')).toHaveLength(1);
  });
});

describe('SupervisionAulasPage — el enlace nunca se ofrece a editar/cancelar (AC8)', () => {
  it('no hay ningún botón de editar ni cancelar sobre las aulas', async () => {
    darSesion(UserRole.ADMIN);
    vi.mocked(getAdminClassrooms).mockResolvedValue(respuesta([aula()]));

    montar();
    await screen.findByText('Conversación cotidiana');

    expect(screen.queryByRole('button', { name: /cancelar/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /editar/i })).toBeNull();
  });
});

describe('SupervisionAulasPage — accesibilidad (AC9)', () => {
  it.each(TEMAS)('sale limpia en el tema %s, con datos', async (tema) => {
    darSesion(UserRole.ADMIN);
    vi.mocked(getAdminClassrooms).mockResolvedValue(respuesta([aula()]));

    const { container } = renderConProviders(<AppRoutes />, { ruta: '/admin/aulas', tema });

    await screen.findByText('Conversación cotidiana');
    await esperarSinFallosDeAccesibilidad(container);
  });
});
