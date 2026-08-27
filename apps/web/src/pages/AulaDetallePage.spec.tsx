import {
  ApiErrorCode,
  BookingStatus,
  type ClassroomDetail,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  UserRole,
} from '@academia/types';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import { createBooking } from '@/features/aulas/api/create-booking';
import { getClassroom } from '@/features/aulas/api/get-classroom';
import { getClassrooms } from '@/features/aulas/api/get-classrooms';
import { getMisAulas } from '@/features/aulas/api/get-mis-aulas';
import { ApiClientError } from '@/lib/api-error';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';

vi.mock('@/features/aulas/api/get-classroom', () => ({ getClassroom: vi.fn() }));
vi.mock('@/features/aulas/api/get-classrooms', () => ({ getClassrooms: vi.fn() }));
vi.mock('@/features/aulas/api/get-mis-aulas', () => ({ getMisAulas: vi.fn() }));
vi.mock('@/features/aulas/api/create-booking', () => ({ createBooking: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];
const ID = 'aula-42';
const RUTA = `/aulas/${ID}`;
const ENLACE = 'https://meet.google.com/abc-defg-hij';

/** Los ids que `usuarioDePrueba` le da a cada rol. */
const PROFESOR_DUENO = 'user-teacher';

function aula(overrides: Partial<ClassroomDetail> = {}): ClassroomDetail {
  return {
    id: ID,
    teacherId: PROFESOR_DUENO,
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: '2099-08-12T23:00:00.000Z',
    durationMinutes: 90,
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
    myBookingStatus: null,
    ...overrides,
  };
}

/**
 * Monta la tabla de rutas REAL en `/aulas/:id`, no la página suelta.
 *
 * Es la única forma de que `useParams()` devuelva un id: sin un `<Route>` que
 * case el patrón, el hook responde `{}` y el test estaría probando otra cosa.
 * De paso verifica que la ruta está registrada (B6).
 */
function montarDetalle(opciones: { tema?: Tema; ruta?: string } = {}) {
  return renderConProviders(<AppRoutes />, { ruta: opciones.ruta ?? RUTA, tema: opciones.tema });
}

/** El 404 del contrato, tal y como llega desde `http-client`. */
function errorNoEncontrada() {
  return new ApiClientError(
    { code: ApiErrorCode.CLASSROOM_NOT_FOUND, message: 'No encontramos esta clase.' },
    404,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  darSesion(UserRole.STUDENT);
  vi.mocked(getClassroom).mockResolvedValue({ classroom: aula() });
  vi.mocked(getClassrooms).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  vi.mocked(getMisAulas).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
});

describe('AulaDetallePage — información completa (B1, B2, AC1)', () => {
  it('el <h1> es el título del aula, y es el único', async () => {
    montarDetalle();

    await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lleva el foco al <h1> cuando llega el aula', async () => {
    montarDetalle();

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Conversación cotidiana' }),
      ).toHaveFocus(),
    );
  });

  it('nombra al profesor y el nivel', async () => {
    montarDetalle();

    expect(
      await screen.findByText('Clase de nivel intermedio con Ana Restrepo.'),
    ).toBeInTheDocument();
  });

  it('muestra la descripción bajo su propio encabezado', async () => {
    montarDetalle();

    expect(await screen.findByRole('heading', { level: 2, name: 'De qué trata la clase' }));
    expect(screen.getByText('Practicamos saludos y presentaciones.')).toBeInTheDocument();
  });

  it('muestra la duración en palabras', async () => {
    montarDetalle();

    expect(await screen.findByText('1 hora 30 minutos')).toBeInTheDocument();
  });

  /**
   * §4.7 y el microcopy: la hora **siempre** lleva su zona nombrada. Una hora
   * sin zona es la forma más barata de que el estudiante llegue tarde, que es
   * justo lo que este producto existe para evitar.
   */
  it('muestra la fecha con la zona horaria explícita', async () => {
    montarDetalle();

    const fecha = await screen.findByText(/2099/);
    expect(fecha.textContent).toMatch(/\(.+\)$/);
  });

  it('muestra el cupo con el conteo literal', async () => {
    montarDetalle();

    expect(await screen.findByRole('progressbar', { name: 'Cupo del aula' })).toHaveAttribute(
      'aria-valuetext',
      'Quedan 8 de 10 lugares',
    );
  });

  /**
   * Los mismos dos números al revés: el dueño quiere saber cuánta gente viene
   * (`patrones-dominio.md`), no cuánto sitio le queda.
   */
  it('al dueño le cuenta los inscritos, no los cupos libres', async () => {
    darSesion(UserRole.TEACHER);
    montarDetalle();

    expect(
      await screen.findByRole('progressbar', { name: 'Estudiantes inscritos' }),
    ).toBeInTheDocument();
  });
});

describe('AulaDetallePage — el estado sale de derivarEstadoAula() (B3, AC6)', () => {
  it('un aula con pocos cupos muestra el estado derivado del cupo', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ currentBookings: 8, maxStudents: 10 }),
    });
    montarDetalle();

    expect(await screen.findByText('Quedan 2 cupos')).toBeInTheDocument();
  });

  it('un aula llena se pinta como llena aunque su status sea PUBLISHED', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ currentBookings: 10, maxStudents: 10 }),
    });
    montarDetalle();

    expect(await screen.findByText('Sin cupos')).toBeInTheDocument();
  });
});

describe('AulaDetallePage — el enlace se pinta solo si el servidor lo mandó (AC2)', () => {
  it('cuando llega, se muestra completo y abre la reunión', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aula({ meetingLink: ENLACE }) });
    montarDetalle();

    const enlace = await screen.findByRole('link', { name: /meet\.google\.com/ });

    expect(enlace).toHaveAttribute('href', ENLACE);
    expect(enlace).toHaveAccessibleName(expect.stringContaining('se abre en otra pestaña'));
  });

  it('prioriza una acción clara para entrar a la clase', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aula({ meetingLink: ENLACE }) });
    montarDetalle();

    expect(await screen.findByRole('link', { name: /Entrar a la clase/ })).toHaveAttribute(
      'href',
      ENLACE,
    );
  });

  /**
   * El caso normal: la respuesta **no trae la clave**, y la pantalla no inventa
   * un hueco vacío ni un aviso de que existe algo que no puede ver.
   */
  it('cuando no llega, no hay ni sección de enlace ni rastro de la URL', async () => {
    montarDetalle();

    await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' });

    expect(screen.queryByRole('heading', { name: 'Enlace de la clase' })).not.toBeInTheDocument();
    expect(screen.queryByText(/meet\.google\.com/)).not.toBeInTheDocument();
  });
});

describe('AulaDetallePage — aula cancelada (AC4)', () => {
  beforeEach(() => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ status: ClassroomStatus.CANCELLED }),
    });
  });

  it('se abre y dice que está cancelada, con texto además del color', async () => {
    montarDetalle();

    expect(await screen.findByText('Clase cancelada')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Conversación cotidiana' }),
    ).toBeInTheDocument();
  });

  it('no ofrece ninguna acción de gestión, ni siquiera al dueño', async () => {
    darSesion(UserRole.TEACHER);
    montarDetalle();

    await screen.findByText('Clase cancelada');

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  /**
   * «Sin enlace de reunión, en ningún caso» (decisión de auditoría 3). Quien lo
   * garantiza de verdad es el servidor —`revelarElEnlace()` corta por
   * `CANCELLED` antes que por identidad, y hay un test suyo—; esto comprueba la
   * otra mitad: la pantalla no lo inventa cuando la respuesta no lo trae.
   */
  it('no muestra enlace de reunión al dueño de un aula cancelada', async () => {
    darSesion(UserRole.TEACHER);
    montarDetalle();

    await screen.findByText('Clase cancelada');

    expect(screen.queryByRole('heading', { name: 'Enlace de la clase' })).not.toBeInTheDocument();
    expect(screen.queryByText(/meet\.google\.com/)).not.toBeInTheDocument();
  });
});

describe('AulaDetallePage — los 4 estados (B5)', () => {
  /**
   * El `<h1>` es el texto de la carga —y recibe el foco—, así que quien navega
   * con lector se entera de que está esperando sin oírlo dos veces. El esqueleto
   * queda fuera del árbol de accesibilidad: no dice nada que el título no diga.
   */
  it('cargando: lo dice con texto, no solo con un esqueleto', () => {
    vi.mocked(getClassroom).mockReturnValue(new Promise(() => {}));
    const { container } = montarDetalle();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cargando la clase…');
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(container.querySelector('.animate-pulse')).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * AC3: no encontrada **con salida hacia el listado**, nunca una pantalla en
   * blanco. Quien llega con un enlace viejo tiene que poder seguir desde aquí
   * sin usar el botón de volver del navegador.
   */
  it('no encontrada: lo explica y ofrece la salida al catálogo', async () => {
    vi.mocked(getClassroom).mockRejectedValue(errorNoEncontrada());
    montarDetalle();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No encontramos esta clase' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Esta clase ya no está')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver las aulas publicadas' })).toHaveAttribute(
      'href',
      '/aulas',
    );
  });

  it('no encontrada: no se reintenta, porque el aula no va a aparecer', async () => {
    vi.mocked(getClassroom).mockRejectedValue(errorNoEncontrada());
    montarDetalle();

    await screen.findByRole('heading', { level: 1, name: 'No encontramos esta clase' });

    expect(getClassroom).toHaveBeenCalledTimes(1);
  });

  /**
   * El contrapunto del test de arriba: un fallo de red **sí** se reintenta una
   * vez, porque ahí insistir puede funcionar. El `findBy` espera ese reintento
   * con su backoff real — es el comportamiento que se está afirmando.
   */
  it('error de lectura: se reintenta una vez, y después explica', async () => {
    vi.mocked(getClassroom).mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'sin red' }),
    );
    montarDetalle();

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'No pudimos cargar esta clase' },
        { timeout: 6000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a cargar/i })).toBeInTheDocument();
    expect(getClassroom).toHaveBeenCalledTimes(2);
  });

  it('contenido: la ficha del aula', async () => {
    montarDetalle();

    expect(await screen.findByText('Practicamos saludos y presentaciones.')).toBeInTheDocument();
  });
});

/**
 * AC5 — **el CTA por rol.** Hoy la mitad positiva no existe: HU-202 todavía no
 * trae `Editar clase` ni `Cancelar clase`, así que el detalle no las pinta para
 * nadie (ver `<AccionesDeAula>`). Lo que este bloque fija es la mitad que sí es
 * definitiva: **quien no es el dueño no ve nunca una acción de gestión**, y
 * seguirá sin verla cuando HU-202 las añada.
 */
describe('AulaDetallePage — acciones de gestión por rol (AC5)', () => {
  it.each([UserRole.STUDENT, UserRole.ADMIN])(
    'un %s no ve ninguna acción de gestión',
    async (rol) => {
      darSesion(rol);
      montarDetalle();

      await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' });

      expect(screen.queryByRole('button', { name: /editar|cancelar/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /editar|cancelar|duplicar/i }),
      ).not.toBeInTheDocument();
    },
  );

  it('un profesor que no es el dueño tampoco las ve', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aula({ teacherId: 'otro-profesor' }) });
    montarDetalle();

    await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' });

    expect(screen.queryByRole('button', { name: /editar|cancelar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /duplicar/i })).not.toBeInTheDocument();
  });
});

/** HU-213, AC1/AC6: `Duplicar clase` solo para el dueño, y lleva a la ruta del formulario. */
describe('AulaDetallePage — duplicar clase (AC1, AC6)', () => {
  it('el dueño ve «Duplicar clase» y lleva a /mis-aulas/nueva?desde=<id>', async () => {
    darSesion(UserRole.TEACHER);
    montarDetalle();

    const enlace = await screen.findByRole('link', { name: /duplicar clase/i });
    expect(enlace).toHaveAttribute('href', `/mis-aulas/nueva?desde=${ID}`);
  });

  it('el dueño la ve incluso sobre una clase cancelada', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ status: ClassroomStatus.CANCELLED }),
    });
    montarDetalle();

    expect(await screen.findByRole('link', { name: /duplicar clase/i })).toBeInTheDocument();
  });
});

/**
 * AC8 — la deuda del AC9 de HU-207, cerrada de punta a punta.
 *
 * Se monta la tabla de rutas real y se pulsa la tarjeta como lo haría una
 * persona: si la ruta no estuviera registrada, esto aterrizaría en la 404.
 */
describe('De la tarjeta al detalle (B6, AC8)', () => {
  it('desde /mis-aulas, pulsar el título del aula lleva a su detalle', async () => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getMisAulas).mockResolvedValue({
      items: [aula()],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { user } = montarDetalle({ ruta: '/mis-aulas' });

    await user.click(await screen.findByRole('link', { name: 'Conversación cotidiana' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' }),
    ).toBeInTheDocument();
    expect(getClassroom).toHaveBeenCalledWith(ID);
  });

  it('desde /aulas, pulsar el título del aula lleva a su detalle', async () => {
    vi.mocked(getClassrooms).mockResolvedValue({
      items: [aula()],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { user } = montarDetalle({ ruta: '/aulas' });

    await user.click(await screen.findByRole('link', { name: 'Conversación cotidiana' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'De qué trata la clase' }));
    expect(getClassroom).toHaveBeenCalledWith(ID);
  });
});

/**
 * HU-301, T7 — reservar desde el detalle del aula. `darSesion(STUDENT)` ya es
 * el default del `beforeEach`, y `aula()` por defecto queda en `disponible`.
 */
describe('AulaDetallePage — reservar un cupo (HU-301)', () => {
  it('un STUDENT ve «Reservar mi cupo» sobre un aula disponible', async () => {
    montarDetalle();

    expect(await screen.findByRole('button', { name: 'Reservar mi cupo' })).toBeInTheDocument();
  });

  // AC4: el elemento no existe en el DOM, nunca deshabilitado.
  it.each([UserRole.TEACHER, UserRole.ADMIN])('un %s no ve el botón de reservar', async (rol) => {
    darSesion(rol);
    montarDetalle();

    await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' });

    expect(screen.queryByRole('button', { name: /reservar/i })).not.toBeInTheDocument();
  });

  it('con la reserva ya CONFIRMED, no ofrece reservar otra vez y pinta «Tienes tu cupo»', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ myBookingStatus: BookingStatus.CONFIRMED }),
    });
    montarDetalle();

    expect(await screen.findByText('Tienes tu cupo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar mi cupo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cupo reservado' })).toBeDisabled();
  });

  it('un aula llena no ofrece reservar', async () => {
    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ currentBookings: 10, maxStudents: 10 }),
    });
    montarDetalle();

    await screen.findByText('Sin cupos');

    expect(screen.queryByRole('button', { name: /reservar/i })).not.toBeInTheDocument();
  });

  /**
   * AC5 — sin optimismo. Mientras la petición está en vuelo, el estado sigue
   * siendo `disponible`: nada se pinta como reservado hasta que el servidor
   * confirma.
   */
  it('mientras reserva, no pinta el aula como reservada todavía', async () => {
    vi.mocked(createBooking).mockReturnValue(new Promise(() => {}));
    const { user } = montarDetalle();

    await user.click(await screen.findByRole('button', { name: 'Reservar mi cupo' }));

    expect(screen.getByRole('button', { name: 'Reservando…' })).toBeDisabled();
    expect(screen.queryByText('Tienes tu cupo')).not.toBeInTheDocument();
    expect(screen.getByText('Hay cupo')).toBeInTheDocument();
  });

  /**
   * AC5, segunda mitad. Al confirmar, se re-consulta el aula (T7): la
   * respuesta trae `myBookingStatus: CONFIRMED` y el estado pasa a
   * `reservada`, con color + ícono + texto.
   */
  it('al confirmar, re-consulta el aula y el estado pasa a reservada', async () => {
    vi.mocked(createBooking).mockResolvedValue({
      booking: {
        id: 'reserva-1',
        studentId: 'user-student',
        classroomId: ID,
        status: BookingStatus.CONFIRMED,
        cancelledAt: null,
        createdAt: '2026-08-26T10:00:00.000Z',
        updatedAt: '2026-08-26T10:00:00.000Z',
      },
    });
    const { user } = montarDetalle();

    vi.mocked(getClassroom).mockResolvedValue({
      classroom: aula({ myBookingStatus: BookingStatus.CONFIRMED }),
    });

    await user.click(await screen.findByRole('button', { name: 'Reservar mi cupo' }));

    // Se invalida y se re-consulta el aula al confirmar (T7): la segunda
    // respuesta ya trae la reserva, y el estado se actualiza con ella.
    await waitFor(() => expect(getClassroom).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Tienes tu cupo')).toBeInTheDocument();
    // El botón de reservar se reemplaza por uno inhabilitado que lo explica,
    // no desaparece sin más.
    expect(screen.getByRole('button', { name: 'Cupo reservado' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Reservar mi cupo' })).not.toBeInTheDocument();
  });

  /**
   * AC2 — cada código de error con su mensaje literal, nunca el texto crudo
   * del servidor (`contrato-api.md` §3).
   */
  it.each([
    [
      ApiErrorCode.CLASSROOM_FULL,
      'Ya no quedan cupos en esta clase. Alguien reservó el último mientras tanto.',
    ],
    [ApiErrorCode.BOOKING_ALREADY_EXISTS, 'Ya tienes una reserva en esta clase.'],
    [ApiErrorCode.BOOKING_OVERLAP, 'Ya tienes otra clase reservada en ese horario.'],
    [
      ApiErrorCode.CLASSROOM_NOT_BOOKABLE,
      'Esta clase ya no admite reservas: se canceló o ya empezó.',
    ],
  ])('%s muestra su mensaje literal', async (code, mensaje) => {
    vi.mocked(createBooking).mockRejectedValue(new ApiClientError({ code, message: 'x' }, 409));
    const { user } = montarDetalle();

    await user.click(await screen.findByRole('button', { name: 'Reservar mi cupo' }));

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    // El botón sigue ahí: el fallo no se lleva la posibilidad de reintentar.
    expect(screen.getByRole('button', { name: 'Reservar mi cupo' })).toBeInTheDocument();
  });
});

describe('AulaDetallePage — accesibilidad automática (AC7)', () => {
  it.each(TEMAS)('el aula, sin violaciones en el tema %s', async (tema) => {
    darSesion(UserRole.TEACHER);
    vi.mocked(getClassroom).mockResolvedValue({ classroom: aula({ meetingLink: ENLACE }) });
    const { container } = montarDetalle({ tema });

    await screen.findByRole('heading', { level: 1, name: 'Conversación cotidiana' });
    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('el estado de carga, sin violaciones en el tema %s', async (tema) => {
    vi.mocked(getClassroom).mockReturnValue(new Promise(() => {}));
    const { container } = montarDetalle({ tema });

    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('el estado de no encontrada, sin violaciones en el tema %s', async (tema) => {
    vi.mocked(getClassroom).mockRejectedValue(errorNoEncontrada());
    const { container } = montarDetalle({ tema });

    await screen.findByRole('heading', { level: 1, name: 'No encontramos esta clase' });
    await esperarSinFallosDeAccesibilidad(container);
  });
});
