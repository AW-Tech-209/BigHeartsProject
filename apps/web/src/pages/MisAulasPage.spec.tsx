import {
  type Classroom,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  EstadoTemporalAula,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMisAulas } from '@/features/aulas/api/get-mis-aulas';
import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { MisAulasPage } from './MisAulasPage';

vi.mock('@/features/aulas/api/get-mis-aulas', () => ({ getMisAulas: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function aula(overrides: Partial<Classroom> = {}): Classroom {
  return {
    id: 'aula-1',
    teacherId: 'user-teacher',
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
    ...overrides,
  };
}

function respuesta(
  items: Classroom[],
  overrides: Partial<{ total: number; page: number; pageSize: number }> = {},
) {
  return { items, total: items.length, page: 1, pageSize: 20, ...overrides };
}

/** La cabecera de la página: el `<header>` que contiene el `<h1>`. */
function cabecera(): HTMLElement {
  const titulo = screen.getByRole('heading', { level: 1, name: 'Mis aulas' });
  const header = titulo.closest('header');
  if (!header) throw new Error('El <h1> no está dentro de una <PaginaCabecera>.');
  return header;
}

/** La región viva de `<LiveAnnouncerProvider>`. */
function regionViva() {
  return screen.getByRole('status');
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.TEACHER);
});

describe('MisAulasPage — los cuatro estados (B6)', () => {
  it('cargando: lo dice con texto, no con un spinner mudo', () => {
    vi.mocked(getMisAulas).mockReturnValue(new Promise(() => undefined));

    renderConProviders(<MisAulasPage />);

    expect(screen.getByText('Cargando tus aulas…')).toBeInTheDocument();
  });

  it('vacío: invita a publicar la primera clase', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />);

    expect(await screen.findByText('Todavía no creaste ninguna aula')).toBeInTheDocument();
  });

  it('error: explica y ofrece volver a cargar', async () => {
    vi.mocked(getMisAulas).mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'No pudimos conectar.' }),
    );

    renderConProviders(<MisAulasPage />);

    expect(await screen.findByText('No pudimos cargar tus aulas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a cargar/i })).toBeInTheDocument();
  });
});

describe('MisAulasPage — el listado del profesor (AC1)', () => {
  // AC1: el hueco que originó la HU. Con tres aulas creadas se ven las tres.
  it('un profesor con tres aulas las ve las tres, y ya no el estado vacío', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([
        aula({ id: '1', title: 'Conversación cotidiana' }),
        aula({ id: '2', title: 'Inglés de negocios' }),
        aula({ id: '3', title: 'Pronunciación' }),
      ]),
    );

    renderConProviders(<MisAulasPage />);

    expect(
      await screen.findByRole('article', { name: 'Conversación cotidiana' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Inglés de negocios' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Pronunciación' })).toBeInTheDocument();
    expect(screen.queryByText('Todavía no creaste ninguna aula')).toBeNull();
  });

  // AC8: al profesor le importa cuánta gente viene, no cuánto queda.
  it('cada tarjeta cuenta inscritos sobre cupo, no cupos disponibles', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([aula({ currentBookings: 8, maxStudents: 10 })]),
    );

    renderConProviders(<MisAulasPage />);

    expect(await screen.findByText('8 de 10 inscritos')).toBeInTheDocument();
    expect(screen.queryByText('Quedan 2 cupos')).toBeNull();
  });

  it('ofrece editar y cancelar desde cada tarjeta', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula({ id: 'aula-42' })]));

    renderConProviders(<MisAulasPage />);

    const tarjeta = await screen.findByRole('article');
    expect(within(tarjeta).getByRole('link', { name: 'Editar clase' })).toHaveAttribute(
      'href',
      '/mis-aulas/aula-42/editar',
    );
    expect(within(tarjeta).getByRole('button', { name: 'Cancelar clase' })).toBeInTheDocument();
  });
});

describe('MisAulasPage — D34: solo lo próximo, con enlace al historial', () => {
  it('pide siempre el filtro próximas, y enlaza al historial', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<MisAulasPage />);

    await screen.findByRole('article');
    expect(vi.mocked(getMisAulas).mock.calls[0]?.[0]).toEqual({
      estado: EstadoTemporalAula.PROXIMAS,
    });
    expect(screen.getByRole('link', { name: 'Ver historial' })).toHaveAttribute(
      'href',
      '/historial',
    );
  });
});

/**
 * AC10 — una sola acción primaria, y en un solo sitio.
 *
 * Con lista, `Crear una clase` vive en la cabecera; sin ella, dentro del estado
 * vacío. Pintarla en los dos deja dos acciones primarias compitiendo, que es lo
 * que prohíbe `layout-y-composicion.md` (decisión 4 de la HU).
 */
describe('MisAulasPage — una sola acción primaria (B5, AC10)', () => {
  it('con lista, «Crear una clase» está en la cabecera y no se repite', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    const enlaces = screen.getAllByRole('link', { name: 'Crear una clase' });
    expect(enlaces).toHaveLength(1);
    expect(within(cabecera()).getByRole('link', { name: 'Crear una clase' })).toBe(enlaces[0]);
    expect(enlaces[0]).toHaveAttribute('href', '/mis-aulas/nueva');
  });

  it('sin ninguna aula, la acción baja al estado vacío y sale de la cabecera', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />);
    await screen.findByText('Todavía no creaste ninguna aula');

    expect(screen.getAllByRole('link', { name: 'Crear una clase' })).toHaveLength(1);
    expect(within(cabecera()).queryByRole('link', { name: 'Crear una clase' })).toBeNull();
  });
});

/**
 * HU-211, T15 — la vía para que un aula «sin indicar» deje de estarlo, desde
 * el registro completo del profesor.
 */
describe('MisAulasPage — completar accesibilidad (T15)', () => {
  it('un aula sin modos declarados ofrece «Completar accesibilidad»', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([aula({ id: 'sin-indicar', communicationModes: [] })]),
    );

    renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    expect(screen.getByRole('link', { name: 'Completar accesibilidad' })).toHaveAttribute(
      'href',
      '/mis-aulas/sin-indicar/accesibilidad',
    );
  });

  it('un aula que ya declaró modos no ofrece el enlace', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] })]),
    );

    renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    expect(screen.queryByRole('link', { name: 'Completar accesibilidad' })).toBeNull();
  });
});

describe('MisAulasPage — anuncio del resultado (AC12)', () => {
  it('anuncia cuántas aulas se encontraron', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula(), aula({ id: 'aula-2' })]));

    renderConProviders(<MisAulasPage />);

    await waitFor(() => expect(regionViva()).toHaveTextContent('Se encontraron 2 aulas.'));
  });

  it('anuncia el vacío con el mismo texto que se ve en pantalla', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />);

    await waitFor(() => expect(regionViva()).toHaveTextContent('Todavía no creaste ninguna aula.'));
  });
});

describe('MisAulasPage — paginación (A5)', () => {
  it('con una sola página no muestra controles', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()], { total: 1 }));

    renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    expect(screen.queryByRole('navigation', { name: 'Paginación de mis aulas' })).toBeNull();
  });

  it('con más de una página avanza con Siguiente', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()], { total: 25, pageSize: 20 }));
    const { user } = renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    const paginacion = within(screen.getByRole('navigation', { name: 'Paginación de mis aulas' }));
    expect(paginacion.getByText('Página 1 de 2')).toBeInTheDocument();

    await user.click(paginacion.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() =>
      expect(vi.mocked(getMisAulas).mock.calls.at(-1)?.[0]).toEqual({
        estado: EstadoTemporalAula.PROXIMAS,
        page: 2,
      }),
    );
  });
});

/**
 * AC12 — `axe` sobre la pantalla **con contenido**. `paginas.spec.tsx` ya la
 * recorre en los tres temas, pero siempre en su estado vacío; la rejilla solo
 * aparece con respuesta.
 */
describe('MisAulasPage — accesibilidad con datos (AC12)', () => {
  it.each(TEMAS)('sale limpia en el tema %s', async (tema) => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([aula(), aula({ id: 'aula-2', title: 'Inglés de negocios' })]),
    );

    const { container } = renderConProviders(<MisAulasPage />, { tema });

    await screen.findByRole('article', { name: 'Conversación cotidiana' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
