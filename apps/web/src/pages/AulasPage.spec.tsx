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
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
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
    communicationModes: [],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
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

/**
 * HU-208 — el catálogo distingue quién lo mira.
 *
 * `darSesion()` da al profesor el id `user-teacher`, que es con el que se
 * siembran aquí las aulas propias.
 */
const ID_DEL_PROFESOR = 'user-teacher';

describe('AulasPage — la clase propia se distingue (T1, AC1)', () => {
  it('el profesor ve «Tu clase» en la suya y no en la ajena', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(
      respuesta([
        aula({ id: 'mia', title: 'Mi clase', teacherId: ID_DEL_PROFESOR }),
        aula({ id: 'ajena', title: 'Clase de Ana', teacherId: 'otro-profe' }),
      ]),
    );

    renderConProviders(<AulasPage />);

    const mia = within(await screen.findByRole('article', { name: 'Mi clase' }));
    const ajena = within(screen.getByRole('article', { name: 'Clase de Ana' }));
    expect(mia.getByText('Tu clase')).toBeInTheDocument();
    expect(ajena.queryByText('Tu clase')).not.toBeInTheDocument();
  });

  // AC3: la acción cambia de verbo y de promesa, solo sobre la suya.
  it('solo la clase propia ofrece «Gestionar mi clase»', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(
      respuesta([
        aula({ id: 'mia', title: 'Mi clase', teacherId: ID_DEL_PROFESOR }),
        aula({ id: 'ajena', title: 'Clase de Ana', teacherId: 'otro-profe' }),
      ]),
    );

    renderConProviders(<AulasPage />);
    await screen.findByRole('article', { name: 'Mi clase' });

    const enlaces = screen.getAllByRole('link', { name: 'Gestionar mi clase' });
    expect(enlaces).toHaveLength(1);
    expect(enlaces[0]).toHaveAttribute('href', '/aulas/mia');
  });

  /**
   * AC1, la mitad que evita el falso positivo más fácil: un estudiante no es
   * `teacherId` de nada, así que jamás debe ver la marca. Si alguien cambiara
   * la comparación por «tengo sesión», este test lo caza.
   */
  it.each([UserRole.STUDENT, UserRole.ADMIN])(
    'un %s no ve la marca en ninguna tarjeta',
    async (role) => {
      darSesion(role);
      vi.mocked(getClassrooms).mockResolvedValue(
        respuesta([
          aula({ id: 'a1', title: 'Clase de Paula', teacherId: ID_DEL_PROFESOR }),
          aula({ id: 'a2', title: 'Clase de Ana', teacherId: 'otro-profe' }),
        ]),
      );

      renderConProviders(<AulasPage />);
      await screen.findByRole('article', { name: 'Clase de Paula' });

      expect(screen.queryByText('Tu clase')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Gestionar mi clase' })).not.toBeInTheDocument();
    },
  );
});

/** AC4 — **el elemento no está en el DOM**, no está deshabilitado. Un test por rol. */
describe('AulasPage — la acción de reservar, por rol (T3, AC4, HU-301)', () => {
  it.each([UserRole.TEACHER, UserRole.ADMIN])(
    'un %s no encuentra ninguna acción de reservar',
    async (role) => {
      darSesion(role);
      vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula({ teacherId: ID_DEL_PROFESOR })]));

      renderConProviders(<AulasPage />);
      await screen.findByRole('article');

      expect(screen.queryByRole('button', { name: /reservar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /reservar/i })).not.toBeInTheDocument();
    },
  );

  it('un STUDENT sí ve «Reservar mi cupo» sobre un aula disponible', async () => {
    darSesion(UserRole.STUDENT);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula({ teacherId: ID_DEL_PROFESOR })]));

    renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    expect(screen.getByRole('button', { name: 'Reservar mi cupo' })).toBeInTheDocument();
  });
});

describe('AulasPage — el filtro «Solo mis clases» (T4, AC5, AC6)', () => {
  // AC5: se pinta para el profesor…
  it('el profesor ve la casilla', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    expect(screen.getByLabelText('Solo mis clases')).toBeInTheDocument();
  });

  // …y para nadie más. No deshabilitada: ausente.
  it.each([UserRole.STUDENT, UserRole.ADMIN])('un %s no ve la casilla', async (role) => {
    darSesion(role);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    expect(screen.queryByLabelText('Solo mis clases')).not.toBeInTheDocument();
  });

  // El filtro se resuelve en el SERVIDOR: si se filtrara la página ya recibida,
  // `total` seguiría contando aulas ajenas y las propias de otras páginas no
  // aparecerían nunca.
  it('marcarla vuelve a pedir el catálogo con `mias`', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()]));
    const { user } = renderConProviders(<AulasPage />);
    await screen.findByRole('article');

    await user.click(screen.getByLabelText('Solo mis clases'));

    await waitFor(() =>
      expect(vi.mocked(getClassrooms).mock.calls.at(-1)?.[0]).toEqual({ mias: true }),
    );
  });

  // AC6: copiar el enlace y abrirlo reproduce la vista, casilla incluida.
  it('una URL con `mias=true` abre con la casilla marcada y pide ese filtro', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?mias=true' });
    await screen.findByRole('article');

    expect(screen.getByLabelText('Solo mis clases')).toBeChecked();
    expect(vi.mocked(getClassrooms).mock.calls[0]?.[0]).toEqual({ mias: true });
  });

  it('desmarcarla quita `mias` del query, no lo manda en false', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([aula()]));
    const { user } = renderConProviders(<AulasPage />, { ruta: '/aulas?mias=true' });
    await screen.findByRole('article');

    await user.click(screen.getByLabelText('Solo mis clases'));

    await waitFor(() => expect(vi.mocked(getClassrooms).mock.calls.at(-1)?.[0]).toEqual({}));
  });
});

/**
 * AC7 — el vacío del profesor es suyo, no el del catálogo.
 *
 * «Prueba con otro nivel u otra fecha» invita a explorar la oferta ajena, y
 * quien marcó `Solo mis clases` está mirando su propio registro.
 */
describe('AulasPage — el vacío de «Solo mis clases» (T5, AC7)', () => {
  it('con el filtro puesto y sin resultados, usa su propio texto', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?mias=true' });

    expect(
      await screen.findByText('No tienes clases publicadas con esos filtros.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No hay aulas con esos filtros')).not.toBeInTheDocument();
    expect(screen.queryByText('Todavía no hay aulas publicadas')).not.toBeInTheDocument();
  });

  it('lo anuncia por región viva con el mismo texto que se ve', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?mias=true' });

    await waitFor(() =>
      expect(regionViva()).toHaveTextContent('No tienes clases publicadas con esos filtros.'),
    );
  });

  // Gana también combinado con otro filtro: `filtrandoLasMias` se mira antes
  // que `hayFiltrosActivos()`, que también cuenta `mias`.
  it('gana sobre el genérico aunque haya además un filtro de nivel', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?mias=true&level=ADVANCED' });

    expect(
      await screen.findByText('No tienes clases publicadas con esos filtros.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No hay aulas con esos filtros')).not.toBeInTheDocument();
  });

  /**
   * La URL la puede teclear cualquiera. Un estudiante en `/aulas?mias=true`
   * recibe una lista vacía —correcto: ninguna aula es suya— pero decirle
   * «no tienes clases publicadas, publica una clase» sería copy de otro rol.
   */
  it.each([UserRole.STUDENT, UserRole.ADMIN])(
    'un %s que teclea `mias=true` a mano ve el vacío genérico, no el del profesor',
    async (role) => {
      darSesion(role);
      vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

      renderConProviders(<AulasPage />, { ruta: '/aulas?mias=true' });

      expect(await screen.findByText('No hay aulas con esos filtros')).toBeInTheDocument();
      expect(
        screen.queryByText('No tienes clases publicadas con esos filtros.'),
      ).not.toBeInTheDocument();
    },
  );

  it('su salida devuelve el catálogo completo, sin ningún filtro', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));
    const { user } = renderConProviders(<AulasPage />, {
      ruta: '/aulas?mias=true&level=ADVANCED',
    });

    await user.click(await screen.findByRole('button', { name: 'Quitar filtros' }));

    await waitFor(() => expect(vi.mocked(getClassrooms).mock.calls.at(-1)?.[0]).toEqual({}));
  });

  // Sin el filtro, el vacío sigue siendo el de siempre: no se lo hemos robado.
  it('sin `mias`, el vacío con filtros sigue siendo el genérico', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(respuesta([]));

    renderConProviders(<AulasPage />, { ruta: '/aulas?level=ADVANCED' });

    expect(await screen.findByText('No hay aulas con esos filtros')).toBeInTheDocument();
    expect(
      screen.queryByText('No tienes clases publicadas con esos filtros.'),
    ).not.toBeInTheDocument();
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

/**
 * `axe` sobre el catálogo **con contenido**.
 *
 * `paginas.spec.tsx` ya recorre `/aulas` en los tres temas, pero siempre en su
 * estado vacío, que es al que se cae sin datos. La rejilla solo aparece con
 * respuesta, y es ahí donde se destapó el salto de `<h1>` a `<h3>` que arregló
 * HU-207.
 */
describe('AulasPage — accesibilidad con datos', () => {
  const TEMAS: Tema[] = ['light', 'dark', 'hc'];

  it.each(TEMAS)('la rejilla con aulas sale limpia en el tema %s', async (tema) => {
    vi.mocked(getClassrooms).mockResolvedValue(
      respuesta([aula(), aula({ id: 'aula-2', title: 'Inglés de negocios' })]),
    );

    const { container } = renderConProviders(<AulasPage />, { tema });

    await screen.findByRole('article', { name: 'Conversación cotidiana' });
    await esperarSinFallosDeAccesibilidad(container);
  });

  /**
   * AC8 de HU-208: la vista del profesor añade la casilla del filtro, el
   * distintivo y un enlace más por tarjeta propia. `axe` los recorre en los
   * tres temas. Lo que NO comprueba —y por eso el AC pide además una revisión
   * a ojo— es el contraste real: jsdom no calcula CSS.
   */
  it.each(TEMAS)('la vista del profesor sale limpia en el tema %s', async (tema) => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassrooms).mockResolvedValue(
      respuesta([
        aula({ id: 'mia', title: 'Mi clase', teacherId: 'user-teacher' }),
        aula({ id: 'ajena', title: 'Clase de Ana', teacherId: 'otro-profe' }),
      ]),
    );

    const { container } = renderConProviders(<AulasPage />, { tema });

    await screen.findByRole('article', { name: 'Mi clase' });
    await esperarSinFallosDeAccesibilidad(container);
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
