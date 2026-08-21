import {
  type Classroom,
  ClassroomStatus,
  EnglishLevel,
  EstadoTemporalAula,
  MeetingProvider,
  type User,
  UserRole,
  UserStatus,
} from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { getPendingTeachers } from '@/features/admin/api/get-pending-teachers';
import { getMisAulas } from '@/features/aulas/api/get-mis-aulas';
import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { PanelPage } from './PanelPage';

// Las dos fronteras de red que el panel puede tocar, una por rol. Desde HU-207
// la del profesor es `GET /classrooms/mias`, no el catálogo público.
vi.mock('@/features/admin/api/get-pending-teachers', () => ({ getPendingTeachers: vi.fn() }));
vi.mock('@/features/aulas/api/get-mis-aulas', () => ({ getMisAulas: vi.fn() }));

/** El id que `usuarioDePrueba` le da al profesor de la sesión. */
const PROFESOR_DE_LA_SESION = 'user-teacher';

function aula(overrides: Partial<Classroom> = {}): Classroom {
  return {
    id: 'aula-1',
    teacherId: PROFESOR_DE_LA_SESION,
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
    ...overrides,
  };
}

function respuesta(items: Classroom[]) {
  return { items, total: items.length, page: 1, pageSize: 3 };
}

/** Una solicitud de cuenta de profesor esperando decisión. */
function profesorPendiente(): User {
  return {
    id: 'profe-1',
    email: 'paula@academia.local',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: UserRole.TEACHER,
    status: UserStatus.PENDING,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: '2026-08-12T15:30:00.000Z',
    updatedAt: '2026-08-12T15:30:00.000Z',
  };
}

/** Los títulos con los que se reconoce el panel de cada rol. */
const TITULO_DEL_PANEL = {
  [UserRole.STUDENT]: 'Tus clases',
  [UserRole.TEACHER]: 'Tus próximas clases',
  [UserRole.ADMIN]: 'Profesores pendientes',
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [] });
  vi.mocked(getMisAulas).mockResolvedValue(respuesta([]));
});

describe('PanelPage — cada rol ve su panel, y solo el suyo (AC2, AC3, AC4)', () => {
  it.each([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])(
    'con rol %s se pinta su panel y no el de los otros dos',
    async (rol) => {
      darSesion(rol);
      renderConProviders(<PanelPage />);

      expect(
        await screen.findByRole('heading', { level: 2, name: TITULO_DEL_PANEL[rol] }),
      ).toBeInTheDocument();

      const ajenos = Object.entries(TITULO_DEL_PANEL)
        .filter(([otroRol]) => otroRol !== rol)
        .map(([, titulo]) => titulo);

      for (const titulo of ajenos) {
        expect(screen.queryByRole('heading', { level: 2, name: titulo })).toBeNull();
      }
    },
  );

  it('el administrador resuelve las solicitudes AQUÍ, no detrás de un enlace (AC4)', async () => {
    darSesion(UserRole.ADMIN);
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [profesorPendiente()] });

    renderConProviders(<PanelPage />);

    // La tabla y sus acciones están en el propio panel: nada que pulsar antes.
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /profesores pendientes/i })).toBeNull();
  });
});

/**
 * Las dos frases que originaron la HU y las tres fórmulas de futuro que prohíbe
 * el AC8. Se comprueban sobre el texto renderizado de los tres paneles, que es
 * donde el usuario las leería.
 */
describe('PanelPage — el panel no miente (AC1, AC8)', () => {
  const PROHIBIDAS = [
    'Todavía no puedes crear aulas',
    'Todavía no hay aulas publicadas',
    'todavía no',
    'próximamente',
    'cuando esté disponible',
  ];

  it.each([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])(
    'con rol %s no aparece ninguna frase falsa ni ningún texto en futuro',
    async (rol) => {
      darSesion(rol);
      const { container } = renderConProviders(<PanelPage />);

      await screen.findByRole('heading', { level: 2, name: TITULO_DEL_PANEL[rol] });

      const texto = container.textContent ?? '';
      for (const prohibida of PROHIBIDAS) {
        expect(texto.toLowerCase()).not.toContain(prohibida.toLowerCase());
      }
    },
  );
});

describe('PanelPage — una sola acción primaria por panel (AC7)', () => {
  it('el estudiante tiene exactamente una salida, y lleva al catálogo (AC2b)', async () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<PanelPage />);

    const explorar = await screen.findAllByRole('link', { name: 'Explorar clases' });

    expect(explorar).toHaveLength(1);
    expect(explorar[0]).toHaveAttribute('href', '/aulas');
  });

  it('el profesor sin clases tiene exactamente una', async () => {
    darSesion(UserRole.TEACHER);
    renderConProviders(<PanelPage />);

    const crear = await screen.findAllByRole('link', { name: 'Crear una clase' });

    expect(crear).toHaveLength(1);
    expect(crear[0]).toHaveAttribute('href', '/mis-aulas/nueva');
  });

  it('el profesor CON clases sigue teniendo exactamente una, no dos', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<PanelPage />);

    expect(await screen.findAllByRole('link', { name: 'Crear una clase' })).toHaveLength(1);
  });
});

/**
 * El alcance ya **no se decide aquí** (HU-207, T6).
 *
 * Hasta HU-207 el panel leía el catálogo público y comparaba `teacherId` contra
 * la sesión en el cliente, así que tenía sentido probar que descartaba las
 * ajenas. Ahora pide `GET /classrooms/mias`, que viene acotado al token: esa
 * garantía se prueba en el servidor (A6, AC3) y aquí lo único verificable —y lo
 * único que puede romperse— es que el panel pida la consulta correcta y no
 * vuelva a filtrar por su cuenta.
 */
describe('Panel del profesor — el alcance lo pone el servidor (T6, AC13)', () => {
  it('pide sus próximas clases al endpoint acotado al token, sin filtrar en cliente', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<PanelPage />);

    await waitFor(() =>
      expect(getMisAulas).toHaveBeenCalledWith({
        estado: EstadoTemporalAula.PROXIMAS,
        pageSize: 3,
      }),
    );
  });

  it('pinta lo que devuelve el servidor, sin descartar ninguna fila', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getMisAulas).mockResolvedValue(
      respuesta([
        aula({ id: 'una', title: 'Mi clase de conversación' }),
        aula({ id: 'otra', title: 'Mi clase de negocios' }),
      ]),
    );

    renderConProviders(<PanelPage />);

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Mi clase de conversación' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Mi clase de negocios' }),
    ).toBeInTheDocument();
  });
});

describe('Panel del profesor — los cuatro estados (T7)', () => {
  beforeEach(() => darSesion(UserRole.TEACHER));

  it('cargando: lo dice con texto, no con un spinner mudo', () => {
    vi.mocked(getMisAulas).mockReturnValue(new Promise(() => undefined));

    renderConProviders(<PanelPage />);

    expect(screen.getByText('Cargando tus próximas clases…')).toBeInTheDocument();
  });

  it('error: explica y ofrece volver a cargar', async () => {
    vi.mocked(getMisAulas).mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'No pudimos conectar.' }),
    );

    renderConProviders(<PanelPage />);

    expect(await screen.findByText('No pudimos cargar tus clases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a cargar/i })).toBeInTheDocument();
  });

  it('vacío: invita a publicar', async () => {
    renderConProviders(<PanelPage />);

    expect(await screen.findByText('No tienes clases publicadas')).toBeInTheDocument();
  });

  it('lista: pinta la tarjeta del aula', async () => {
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    renderConProviders(<PanelPage />);

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Conversación cotidiana' }),
    ).toBeInTheDocument();
  });
});

/**
 * AC9 — `axe` sobre los paneles **con contenido**.
 *
 * `paginas.spec.tsx` ya recorre `/panel` en los tres roles y los tres temas,
 * pero siempre en su estado vacío, que es al que se cae sin datos. La tabla del
 * administrador y la rejilla del profesor solo aparecen con respuesta, y es ahí
 * donde un `<h2>` mal colocado rompería el orden de encabezados de la página.
 */
describe('PanelPage — accesibilidad con datos (AC9)', () => {
  const TEMAS: Tema[] = ['light', 'dark', 'hc'];

  it.each(TEMAS)('el profesor con clases sale limpio en el tema %s', async (tema) => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getMisAulas).mockResolvedValue(respuesta([aula()]));

    const { container } = renderConProviders(<PanelPage />, { tema });

    await screen.findByRole('heading', { level: 3, name: 'Conversación cotidiana' });
    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('el administrador con cola sale limpio en el tema %s', async (tema) => {
    darSesion(UserRole.ADMIN);
    vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [profesorPendiente()] });

    const { container } = renderConProviders(<PanelPage />, { tema });

    await screen.findByRole('table');
    await esperarSinFallosDeAccesibilidad(container);
  });
});

/**
 * AC6 — un marcador antiguo de `/admin` no se rompe.
 *
 * Se monta la tabla de rutas real (`<AppRoutes />`), no una imitación: lo que se
 * verifica es a dónde lleva esa URL en la aplicación de verdad.
 */
describe('/admin — la ruta no desaparece, redirige (AC6)', () => {
  it('un administrador que entra por /admin aterriza en su panel', async () => {
    darSesion(UserRole.ADMIN);
    renderConProviders(<AppRoutes />, { ruta: '/admin' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Profesores pendientes' }),
    ).toBeInTheDocument();
  });

  it('sin sesión, /admin acaba en el login y no en una pantalla privada', async () => {
    darSesion(null);
    renderConProviders(<AppRoutes />, { ruta: '/admin' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inicia sesión' }),
    ).toBeInTheDocument();
  });
});
