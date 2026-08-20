import {
  type ClassroomListItem,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getClassrooms } from '@/features/aulas/api/get-classrooms';
import { ApiClientError } from '@/lib/api-error';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { AulasPage } from './AulasPage';

vi.mock('@/features/aulas/api/get-classrooms', () => ({ getClassrooms: vi.fn() }));

function aula(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'profe-1',
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
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    teacherFirstName: 'Ana',
    teacherLastName: 'Restrepo',
    ...overrides,
  };
}

function respuesta(
  items: ClassroomListItem[],
  overrides: Partial<{ total: number; page: number; pageSize: number }> = {},
) {
  return { items, total: items.length, page: 1, pageSize: 20, ...overrides };
}

/** La región viva de `<LiveAnnouncerProvider>`. */
function regionViva() {
  return screen.getByRole('status');
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.STUDENT);
});

describe('AulasPage — los cuatro estados (B5)', () => {
  it('cargando: lo dice con texto, no con un spinner mudo', () => {
    vi.mocked(getClassrooms).mockReturnValue(new Promise(() => undefined));

    renderConProviders(<AulasPage />);

    expect(screen.getByText('Cargando aulas disponibles…')).toBeInTheDocument();
  });

  it('vacío sin filtros: el catálogo está sano, invita sin lamentarse', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />);

    expect(await screen.findByText('Todavía no hay aulas publicadas')).toBeInTheDocument();
  });

  // AC8 — texto literal, nunca «Sin resultados».
  it('vacío con filtros activos: invita a probar otro filtro (AC8)', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?level=ADVANCED' });

    expect(await screen.findByText('No hay aulas con esos filtros')).toBeInTheDocument();
    expect(screen.getByText('Prueba con otro nivel u otra fecha.')).toBeInTheDocument();
    expect(screen.queryByText('Sin resultados.')).toBeNull();
  });

  it('quitar filtros desde el vacío vuelve a pedir el catálogo sin ellos', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));
    const { user } = renderConProviders(<AulasPage />, { ruta: '/aulas?level=ADVANCED' });

    await user.click(await screen.findByRole('button', { name: 'Quitar filtros' }));

    await waitFor(() => expect(vi.mocked(getClassrooms).mock.calls.at(-1)?.[0]).toEqual({}));
  });

  it('error: explica y ofrece volver a cargar', async () => {
    vi.mocked(getClassrooms).mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'No pudimos conectar.' }),
    );

    renderConProviders(<AulasPage />);

    expect(await screen.findByText('No pudimos cargar las aulas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a cargar/i })).toBeInTheDocument();
  });

  it('éxito: pinta la rejilla con las aulas devueltas', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(
      respuesta([aula(), aula({ id: 'aula-2', title: 'Inglés de negocios' })]),
    );

    renderConProviders(<AulasPage />);

    expect(
      await screen.findByRole('article', { name: 'Conversación cotidiana' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Inglés de negocios' })).toBeInTheDocument();
  });
});

describe('AulasPage — filtros en la URL (AC4)', () => {
  it('una URL con filtros deja el control reflejando ese valor al montar', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?level=ADVANCED' });
    await screen.findByText('No hay aulas con esos filtros');

    expect(screen.getByLabelText('Nivel')).toHaveValue(EnglishLevel.ADVANCED);
    expect(vi.mocked(getClassrooms).mock.calls[0]?.[0]).toEqual({ level: EnglishLevel.ADVANCED });
  });

  it('elegir un nivel vuelve a pedir el catálogo con ese filtro', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()]));
    const { user } = renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    await user.selectOptions(screen.getByLabelText('Nivel'), EnglishLevel.BEGINNER);

    await waitFor(() =>
      expect(vi.mocked(getClassrooms).mock.calls.at(-1)?.[0]).toEqual({
        level: EnglishLevel.BEGINNER,
      }),
    );
  });
});

describe('AulasPage — anuncio del resultado (AC9)', () => {
  it('anuncia cuántas aulas se encontraron', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula(), aula({ id: 'aula-2' })]));

    renderConProviders(<AulasPage />);

    await waitFor(() => expect(regionViva()).toHaveTextContent('Se encontraron 2 aulas.'));
  });

  it('anuncia el catálogo vacío sin filtros con el mismo texto que el vacío visible', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />);

    await waitFor(() => expect(regionViva()).toHaveTextContent('Todavía no hay aulas publicadas.'));
  });

  it('anuncia cuando no se encontró ninguna CON filtros activos', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?level=ADVANCED' });

    await waitFor(() =>
      expect(regionViva()).toHaveTextContent('No se encontraron aulas con esos filtros.'),
    );
  });
});

describe('AulasPage — paginación (A4, sin scroll infinito)', () => {
  it('sin más de una página, no muestra controles de paginación', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()], { total: 1, pageSize: 20 }));

    renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    expect(screen.queryByRole('navigation', { name: 'Paginación de aulas' })).toBeNull();
  });

  it('con más de una página, muestra "Página X de Y" y avanza con Siguiente', async () => {
    vi.mocked(getClassrooms).mockResolvedValue(
      respuesta([aula()], { total: 25, page: 1, pageSize: 20 }),
    );
    const { user } = renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    const paginacion = within(screen.getByRole('navigation', { name: 'Paginación de aulas' }));
    expect(paginacion.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(paginacion.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await user.click(paginacion.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() =>
      expect(vi.mocked(getClassrooms).mock.calls.at(-1)?.[0]).toEqual({ page: 2 }),
    );
  });
});
