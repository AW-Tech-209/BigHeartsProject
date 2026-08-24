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

  it('vacío sin filtro: invita a publicar la primera clase', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />);

    expect(await screen.findByText('Todavía no creaste ninguna aula')).toBeInTheDocument();
  });

  // Con un filtro puesto, el vacío significa otra cosa: tiene aulas, pero no de
  // ese tipo. La salida es quitar el filtro, no publicar otra clase.
  it('vacío con filtro: la salida es volver a verlas todas', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />, { ruta: '/mis-aulas?estado=canceladas' });

    expect(await screen.findByText('No tienes aulas en este estado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver todas mis aulas' })).toBeInTheDocument();
    expect(screen.queryByText('Sin resultados.')).toBeNull();
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

describe('MisAulasPage — el listado del profesor (AC1, AC2)', () => {
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

  /**
   * AC2 — lo que separa esta pantalla del catálogo: **también las canceladas y
   * las que ya pasaron**, cada una con su estado en color + ícono + texto. Una
   * clase de la semana pasada sigue estando: es el historial del profesor.
   */
  it('muestra las canceladas y las pasadas, cada una con su estado', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([
        aula({ id: 'futura', title: 'Clase de la semana que viene' }),
        aula({
          id: 'cancelada',
          title: 'Clase cancelada de agosto',
          status: ClassroomStatus.CANCELLED,
        }),
        aula({
          id: 'pasada',
          title: 'Clase de la semana pasada',
          scheduledAt: '2020-08-12T23:00:00.000Z',
        }),
      ]),
    );

    renderConProviders(<MisAulasPage />);

    const cancelada = await screen.findByRole('article', { name: 'Clase cancelada de agosto' });
    const pasada = screen.getByRole('article', { name: 'Clase de la semana pasada' });

    expect(within(cancelada).getByText('Clase cancelada')).toBeInTheDocument();
    expect(within(pasada).getByText('Clase finalizada')).toBeInTheDocument();
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

/**
 * AC6 — el filtro vive en la URL.
 *
 * La página deriva su consulta de los search params, así que comprobar **con
 * qué se llamó a la API** es comprobar qué había en la URL: si el filtro no se
 * hubiera escrito ahí, la petición saldría sin él.
 */
describe('MisAulasPage — filtro temporal en la URL (B2, AC6)', () => {
  it('una URL con filtro deja el control marcado y pide ese estado', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />, { ruta: '/mis-aulas?estado=pasadas' });
    await screen.findByText('No tienes aulas en este estado');

    expect(screen.getByLabelText('Estado')).toHaveValue(EstadoTemporalAula.PASADAS);
    expect(vi.mocked(getMisAulas).mock.calls[0]?.[0]).toEqual({
      estado: EstadoTemporalAula.PASADAS,
    });
  });

  it('sin filtro en la URL, el control muestra «Todas» y no se pide ningún estado', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    expect(screen.getByLabelText('Estado')).toHaveValue(EstadoTemporalAula.TODAS);
    expect(vi.mocked(getMisAulas).mock.calls[0]?.[0]).toEqual({});
  });

  it('elegir un estado vuelve a pedir la lista con ese filtro', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));
    const { user } = renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    await user.selectOptions(screen.getByLabelText('Estado'), EstadoTemporalAula.CANCELADAS);

    await waitFor(() =>
      expect(vi.mocked(getMisAulas).mock.calls.at(-1)?.[0]).toEqual({
        estado: EstadoTemporalAula.CANCELADAS,
      }),
    );
  });

  // AC12: el filtro se alcanza y se opera con teclado, sin ratón.
  it('el filtro se alcanza con el tabulador y se cambia con el teclado', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));
    const { user } = renderConProviders(<MisAulasPage />);
    await screen.findByRole('article');

    const filtro = screen.getByLabelText('Estado');
    filtro.focus();
    expect(filtro).toHaveFocus();

    await user.selectOptions(filtro, EstadoTemporalAula.PROXIMAS);

    await waitFor(() =>
      expect(vi.mocked(getMisAulas).mock.calls.at(-1)?.[0]).toEqual({
        estado: EstadoTemporalAula.PROXIMAS,
      }),
    );
  });

  it('quitar el filtro desde el vacío vuelve a pedirlas todas', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));
    const { user } = renderConProviders(<MisAulasPage />, {
      ruta: '/mis-aulas?estado=canceladas',
    });

    await user.click(await screen.findByRole('button', { name: 'Ver todas mis aulas' }));

    await waitFor(() => expect(vi.mocked(getMisAulas).mock.calls.at(-1)?.[0]).toEqual({}));
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

  it('anuncia el vacío sin filtro con el mismo texto que se ve en pantalla', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />);

    await waitFor(() => expect(regionViva()).toHaveTextContent('Todavía no creaste ninguna aula.'));
  });

  it('anuncia el vacío con filtro activo con su propio texto', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));

    renderConProviders(<MisAulasPage />, { ruta: '/mis-aulas?estado=canceladas' });

    await waitFor(() => expect(regionViva()).toHaveTextContent('No tienes aulas en este estado.'));
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

    await waitFor(() => expect(vi.mocked(getMisAulas).mock.calls.at(-1)?.[0]).toEqual({ page: 2 }));
  });
});

/**
 * AC12 — `axe` sobre la pantalla **con contenido**. `paginas.spec.tsx` ya la
 * recorre en los tres temas, pero siempre en su estado vacío; la rejilla y el
 * filtro solo aparecen con respuesta.
 */
describe('MisAulasPage — accesibilidad con datos (AC12)', () => {
  it.each(TEMAS)('sale limpia en el tema %s', async (tema) => {
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([
        aula(),
        aula({ id: 'aula-2', title: 'Inglés de negocios', status: ClassroomStatus.CANCELLED }),
      ]),
    );

    const { container } = renderConProviders(<MisAulasPage />, { tema });

    await screen.findByRole('article', { name: 'Conversación cotidiana' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
