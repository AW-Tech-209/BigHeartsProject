import {
  ApiErrorCode,
  ClassroomStatus,
  EnglishLevel,
  EstadoTemporalAula,
  MeetingProvider,
  UserRole,
  UserStatus,
} from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import type { AppConfigService } from '../config/app-config.service';
import type { NotificationService } from '../notifications/notification.service';
import type { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { ListMisReservasDto } from './dto/list-mis-reservas.dto';

/** Ventana de cancelación y de acceso de fábrica para todos los tests de este archivo. */
const CONFIG = {
  cancellationWindowMinutes: 60,
  accessWindowMinutes: 30,
} as unknown as AppConfigService;

const ESTUDIANTE: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

const AULA_ID = '22222222-2222-4222-8222-222222222222';
const FUTURO = new Date('2027-08-12T18:00:00.000Z');

function aulaBloqueada(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    status: ClassroomStatus.PUBLISHED,
    current_bookings: 0,
    max_students: 10,
    scheduled_at: FUTURO,
    duration_minutes: 60,
    ...overrides,
  };
}

/**
 * Monta el servicio con un Prisma falso.
 *
 * `$transaction` invoca el callback directamente con un `tx` falso: no hay
 * `SELECT … FOR UPDATE` real ni bloqueo de fila — eso solo lo garantiza
 * Postgres. Lo que se prueba aquí es la LÓGICA de las cuatro comprobaciones
 * dentro de la transacción, no el aislamiento real (ver el bloque de
 * "concurrencia" más abajo, que documenta esa misma limitación).
 */
function setup(
  options: {
    filas?: ReturnType<typeof aulaBloqueada>[];
    reservaExistente?: { id: string } | null;
    reservasVigentes?: { classroom: { scheduledAt: Date; durationMinutes: number } }[];
  } = {},
) {
  const queryRaw = vi.fn().mockResolvedValue(options.filas ?? [aulaBloqueada()]);
  const findFirst = vi.fn().mockResolvedValue(options.reservaExistente ?? null);
  const findMany = vi.fn().mockResolvedValue(options.reservasVigentes ?? []);
  const create = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      id: '33333333-3333-4333-8333-333333333333',
      cancelledAt: null,
      createdAt: new Date('2026-08-26T10:00:00.000Z'),
      updatedAt: new Date('2026-08-26T10:00:00.000Z'),
      ...data,
    }),
  );
  const update = vi.fn().mockResolvedValue({});

  const tx = {
    $queryRaw: queryRaw,
    booking: { findFirst, findMany, create },
    classroom: { update },
  };
  const $transaction = vi.fn((callback: (t: typeof tx) => unknown) => callback(tx));
  const findUnique = vi.fn().mockResolvedValue({ firstName: 'Sofía' });
  const notify = vi.fn().mockResolvedValue({ delivered: false, channel: 'log' });

  const prisma = { $transaction, user: { findUnique } } as unknown as PrismaService;
  const notifications = { notify } as unknown as NotificationService;

  return {
    service: new BookingsService(prisma, notifications, CONFIG),
    queryRaw,
    findFirst,
    findMany,
    create,
    update,
    notify,
  };
}

const dto: CreateBookingDto = { classroomId: AULA_ID } as CreateBookingDto;

async function codigoDeError(promesa: Promise<unknown>): Promise<string> {
  try {
    await promesa;
    throw new Error('Se esperaba que la reserva fallara.');
  } catch (error) {
    return (error as { getResponse: () => { code: string } }).getResponse().code;
  }
}

describe('BookingsService.createBooking — el camino feliz', () => {
  it('crea la reserva CONFIRMED y suma el cupo dentro de la misma transacción', async () => {
    const { service, create, update } = setup();

    const respuesta = await service.createBooking(ESTUDIANTE, dto);

    expect(create).toHaveBeenCalledWith({
      data: { studentId: ESTUDIANTE.id, classroomId: AULA_ID, status: 'CONFIRMED' },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: AULA_ID },
      data: { currentBookings: { increment: 1 } },
    });
    expect(respuesta.booking.status).toBe('CONFIRMED');
  });

  it('avisa por el puerto de notificaciones sin tumbar la reserva si el aviso falla', async () => {
    const { service, notify } = setup();
    notify.mockRejectedValueOnce(new Error('sin conexión'));

    await expect(service.createBooking(ESTUDIANTE, dto)).resolves.toBeDefined();
    expect(notify).toHaveBeenCalledWith({
      type: 'BOOKING_CONFIRMED',
      recipient: { email: ESTUDIANTE.email, firstName: 'Sofía' },
    });
  });
});

describe('BookingsService.createBooking — las cuatro comprobaciones (§1)', () => {
  it('aula inexistente → 404 CLASSROOM_NOT_FOUND', async () => {
    const { service } = setup({ filas: [] });

    expect(await codigoDeError(service.createBooking(ESTUDIANTE, dto))).toBe(
      ApiErrorCode.CLASSROOM_NOT_FOUND,
    );
  });

  it('aula CANCELLED → 409 CLASSROOM_NOT_BOOKABLE (T4)', async () => {
    const { service } = setup({ filas: [aulaBloqueada({ status: ClassroomStatus.CANCELLED })] });

    expect(await codigoDeError(service.createBooking(ESTUDIANTE, dto))).toBe(
      ApiErrorCode.CLASSROOM_NOT_BOOKABLE,
    );
  });

  it('aula que ya empezó → 409 CLASSROOM_NOT_BOOKABLE (T4)', async () => {
    const { service } = setup({
      filas: [aulaBloqueada({ scheduled_at: new Date('2020-01-01T00:00:00.000Z') })],
    });

    expect(await codigoDeError(service.createBooking(ESTUDIANTE, dto))).toBe(
      ApiErrorCode.CLASSROOM_NOT_BOOKABLE,
    );
  });

  it('sin cupo → 409 CLASSROOM_FULL (AC1)', async () => {
    const { service } = setup({
      filas: [aulaBloqueada({ current_bookings: 10, max_students: 10 })],
    });

    expect(await codigoDeError(service.createBooking(ESTUDIANTE, dto))).toBe(
      ApiErrorCode.CLASSROOM_FULL,
    );
  });

  it('ya tiene reserva CONFIRMED en esta aula → 409 BOOKING_ALREADY_EXISTS (AC2)', async () => {
    const { service } = setup({ reservaExistente: { id: 'reserva-previa' } });

    expect(await codigoDeError(service.createBooking(ESTUDIANTE, dto))).toBe(
      ApiErrorCode.BOOKING_ALREADY_EXISTS,
    );
  });

  it('se solapa con otra reserva CONFIRMED → 409 BOOKING_OVERLAP (AC2)', async () => {
    const { service } = setup({
      // La nueva aula: 18:00–19:00. La existente empieza a las 18:30: se cruzan.
      reservasVigentes: [
        { classroom: { scheduledAt: new Date('2027-08-12T18:30:00.000Z'), durationMinutes: 60 } },
      ],
    });

    expect(await codigoDeError(service.createBooking(ESTUDIANTE, dto))).toBe(
      ApiErrorCode.BOOKING_OVERLAP,
    );
  });

  /**
   * AC2, el borde exacto: una clase que termina a las 18:00 y otra que
   * empieza a las 18:00 no se solapan (mismo criterio que HU-212, §4.4).
   */
  it('dos clases consecutivas que se tocan en el borde SÍ se pueden reservar las dos', async () => {
    const { service, create } = setup({
      reservasVigentes: [
        { classroom: { scheduledAt: new Date('2027-08-12T17:00:00.000Z'), durationMinutes: 60 } },
      ],
    });

    await service.createBooking(ESTUDIANTE, dto);

    expect(create).toHaveBeenCalled();
  });

  /**
   * AC3 — quien canceló puede volver a reservar. La búsqueda de duplicado
   * filtra `status: 'CONFIRMED'`: una fila `CANCELLED` de la misma aula no la
   * encuentra, así que no bloquea la nueva reserva.
   */
  it('la búsqueda de reserva duplicada solo mira reservas CONFIRMED (AC3)', async () => {
    const { service, findFirst } = setup();

    await service.createBooking(ESTUDIANTE, dto);

    expect(findFirst).toHaveBeenCalledWith({
      where: { studentId: ESTUDIANTE.id, classroomId: AULA_ID, status: 'CONFIRMED' },
      select: { id: true },
    });
  });
});

/**
 * "Concurrencia" simulada, no real: `$transaction` de este spec ejecuta el
 * callback directamente, sin `SELECT … FOR UPDATE` ni bloqueo de fila — eso
 * solo lo da Postgres, y este repo no levanta una BD real en `npm run test`
 * (ver discusión de la HU). Lo que se prueba aquí es que, asumiendo que el
 * bloqueo real serializa a los dos competidores (que es exactamente lo que
 * `FOR UPDATE` garantiza), la lógica de la transacción deja ganar a uno solo:
 * la segunda llamada ve el contador ya incrementado por la primera y recibe
 * `CLASSROOM_FULL`, nunca deja pasar un cupo de más.
 */
describe('BookingsService.createBooking — "concurrencia" (lógica de exactamente un ganador)', () => {
  it('dos estudiantes por el último cupo: uno gana, el otro recibe CLASSROOM_FULL', async () => {
    const estado = aulaBloqueada({ max_students: 1, current_bookings: 0 });
    const queryRaw = vi.fn().mockImplementation(() => Promise.resolve([{ ...estado }]));
    const findFirst = vi.fn().mockResolvedValue(null);
    const findMany = vi.fn().mockResolvedValue([]);
    const create = vi.fn().mockResolvedValue({
      id: 'x',
      status: 'CONFIRMED',
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const update = vi.fn().mockImplementation(() => {
      estado.current_bookings += 1;
      return Promise.resolve({});
    });
    const tx = {
      $queryRaw: queryRaw,
      booking: { findFirst, findMany, create },
      classroom: { update },
    };
    const prisma = {
      $transaction: vi.fn((callback: (t: typeof tx) => unknown) => callback(tx)),
      user: { findUnique: vi.fn().mockResolvedValue({ firstName: 'Sofía' }) },
    } as unknown as PrismaService;
    const notifications = {
      notify: vi.fn().mockResolvedValue({}),
    } as unknown as NotificationService;
    const service = new BookingsService(prisma, notifications, CONFIG);

    const OTRO_ESTUDIANTE: AuthenticatedUser = { ...ESTUDIANTE, id: 'otro-estudiante' };

    await service.createBooking(ESTUDIANTE, dto);
    const segundoCodigo = await codigoDeError(service.createBooking(OTRO_ESTUDIANTE, dto));

    expect(segundoCodigo).toBe(ApiErrorCode.CLASSROOM_FULL);
    expect(estado.current_bookings).toBe(1);
  });
});

/* ------------------------------------------------------------------------- *
 * Cancelar — POST /bookings/:id/cancelar (HU-303)
 * ------------------------------------------------------------------------- */

const BOOKING_ID = '55555555-5555-4555-8555-555555555555';

function reservaConfirmada(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    studentId: ESTUDIANTE.id,
    classroomId: AULA_ID,
    status: 'CONFIRMED',
    cancelledAt: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Monta el servicio para `cancelBooking` con un Prisma falso. Mismo criterio
 * de "concurrencia simulada" que `setup()`: `$transaction` invoca el
 * callback directamente, así que lo que se prueba es la LÓGICA de la
 * transacción, no el aislamiento real de Postgres.
 */
function setupCancelar(
  options: {
    booking?: ReturnType<typeof reservaConfirmada> | null;
    scheduledAt?: Date;
    countCancelada?: number;
    windowMinutes?: number;
  } = {},
) {
  const booking = 'booking' in options ? options.booking : reservaConfirmada();
  const findUniqueBooking = vi.fn().mockResolvedValue(booking);
  const queryRaw = vi
    .fn()
    .mockResolvedValue([{ scheduled_at: options.scheduledAt ?? FUTURO_LEJANO }]);
  const updateMany = vi.fn().mockResolvedValue({ count: options.countCancelada ?? 1 });
  const findUniqueOrThrow = vi.fn().mockResolvedValue({
    ...reservaConfirmada(),
    status: 'CANCELLED',
    cancelledAt: new Date('2026-08-26T10:00:00.000Z'),
  });
  const updateClassroom = vi.fn().mockResolvedValue({});

  const tx = {
    $queryRaw: queryRaw,
    booking: { findUnique: findUniqueBooking, updateMany, findUniqueOrThrow },
    classroom: { update: updateClassroom },
  };
  const $transaction = vi.fn((callback: (t: typeof tx) => unknown) => callback(tx));
  const findUniqueUser = vi.fn().mockResolvedValue({ firstName: 'Sofía' });
  const notify = vi.fn().mockResolvedValue({ delivered: false, channel: 'log' });

  const prisma = {
    $transaction,
    user: { findUnique: findUniqueUser },
  } as unknown as PrismaService;
  const notifications = { notify } as unknown as NotificationService;
  const config = {
    cancellationWindowMinutes: options.windowMinutes ?? 60,
  } as unknown as AppConfigService;

  return {
    service: new BookingsService(prisma, notifications, config),
    findUniqueBooking,
    queryRaw,
    updateMany,
    updateClassroom,
    notify,
  };
}

// Muy por delante en el tiempo: cae dentro de la ventana con cualquier config razonable.
const FUTURO_LEJANO = new Date('2027-08-12T18:00:00.000Z');

describe('BookingsService.cancelBooking — el camino feliz (AC1)', () => {
  it('cancela, marca cancelledAt y decrementa el cupo exactamente uno, dentro de la transacción', async () => {
    const { service, updateMany, updateClassroom } = setupCancelar();

    const respuesta = await service.cancelBooking(ESTUDIANTE, BOOKING_ID);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, status: 'CONFIRMED' },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    });
    expect(updateClassroom).toHaveBeenCalledWith({
      where: { id: AULA_ID },
      data: { currentBookings: { decrement: 1 } },
    });
    expect(respuesta.booking.status).toBe('CANCELLED');
  });

  it('avisa por el puerto de notificaciones sin tumbar la cancelación si el aviso falla', async () => {
    const { service, notify } = setupCancelar();
    notify.mockRejectedValueOnce(new Error('sin conexión'));

    await expect(service.cancelBooking(ESTUDIANTE, BOOKING_ID)).resolves.toBeDefined();
    expect(notify).toHaveBeenCalledWith({
      type: 'BOOKING_CANCELLED',
      recipient: { email: ESTUDIANTE.email, firstName: 'Sofía' },
    });
  });
});

describe('BookingsService.cancelBooking — autorización (AC4)', () => {
  it('reserva inexistente → 404 BOOKING_NOT_FOUND', async () => {
    const { service } = setupCancelar({ booking: null });

    expect(await codigoDeError(service.cancelBooking(ESTUDIANTE, BOOKING_ID))).toBe(
      ApiErrorCode.BOOKING_NOT_FOUND,
    );
  });

  it('reserva de otro estudiante → 404 BOOKING_NOT_FOUND, no 403', async () => {
    const { service } = setupCancelar({
      booking: reservaConfirmada({ studentId: 'otro-estudiante' }),
    });

    expect(await codigoDeError(service.cancelBooking(ESTUDIANTE, BOOKING_ID))).toBe(
      ApiErrorCode.BOOKING_NOT_FOUND,
    );
  });
});

describe('BookingsService.cancelBooking — la ventana (AC3)', () => {
  it('a 59 minutos del inicio → 409 CANCELLATION_WINDOW_CLOSED', async () => {
    const { service } = setupCancelar({
      scheduledAt: new Date(Date.now() + 59 * 60_000),
      windowMinutes: 60,
    });

    expect(await codigoDeError(service.cancelBooking(ESTUDIANTE, BOOKING_ID))).toBe(
      ApiErrorCode.CANCELLATION_WINDOW_CLOSED,
    );
  });

  it('a 61 minutos del inicio, cancela sin problema', async () => {
    const { service, updateMany } = setupCancelar({
      scheduledAt: new Date(Date.now() + 61 * 60_000),
      windowMinutes: 60,
    });

    await service.cancelBooking(ESTUDIANTE, BOOKING_ID);

    expect(updateMany).toHaveBeenCalled();
  });
});

describe('BookingsService.cancelBooking — doble cancelación (AC5)', () => {
  it('cancelar dos veces la misma reserva no decrementa el contador dos veces', async () => {
    const { service, updateClassroom } = setupCancelar({ countCancelada: 0 });

    expect(await codigoDeError(service.cancelBooking(ESTUDIANTE, BOOKING_ID))).toBe(
      ApiErrorCode.BOOKING_NOT_FOUND,
    );
    expect(updateClassroom).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------------- *
 * «Mis reservas» — GET /bookings/mias (HU-302)
 * ------------------------------------------------------------------------- */

const OTRO_ESTUDIANTE_ID = '99999999-9999-4999-8999-999999999999';

function aulaDeReserva(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    teacherId: 'profesor-id',
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 2,
    scheduledAt: new Date('2099-08-12T23:00:00.000Z'),
    durationMinutes: 60,
    meetingLink: 'v1.iv.tag.texto',
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
    teacher: { firstName: 'Paula', lastName: 'Profesora' },
    ...overrides,
  };
}

type FilaReserva = ReturnType<typeof filaReserva>;

/**
 * El `id` que importa para los tests es el del AULA, no el de la reserva:
 * `toClassroomListItem` proyecta el objeto del aula, y es su `id` el que llega
 * a `resultado.items[].id`.
 */
function filaReserva(
  classroomId: string,
  scheduledAt: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `reserva-${classroomId}`,
    studentId: ESTUDIANTE.id,
    classroomId,
    status: 'CONFIRMED',
    cancelledAt: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
    classroom: aulaDeReserva({ id: classroomId, scheduledAt: new Date(scheduledAt) }),
    ...overrides,
  };
}

function reservaCancelada(classroomId: string, scheduledAt: string) {
  return filaReserva(classroomId, scheduledAt, {
    classroom: aulaDeReserva({
      id: classroomId,
      scheduledAt: new Date(scheduledAt),
      status: ClassroomStatus.CANCELLED,
    }),
  });
}

type WhereReserva = {
  studentId?: string;
  classroom?: { status?: unknown; scheduledAt?: { gt?: Date; lte?: Date }; OR?: unknown[] };
};

/**
 * Prisma falso que entiende las cuatro cláusulas de `listMisReservas` sobre
 * `Booking.classroom`, igual que `setupMisAulas` en `classrooms.service.spec.ts`
 * las entiende sobre `Classroom` directo.
 */
function setupMisReservas(
  grupos: { proximas?: FilaReserva[]; pasadas?: FilaReserva[]; canceladas?: FilaReserva[] } = {},
) {
  const proximas = grupos.proximas ?? [];
  const pasadas = grupos.pasadas ?? [];
  const canceladas = grupos.canceladas ?? [];

  function filasDe(where: WhereReserva): FilaReserva[] {
    const c = where.classroom ?? {};
    if (c.OR) return [...canceladas, ...pasadas];
    if (c.status === ClassroomStatus.CANCELLED) return canceladas;
    return c.scheduledAt?.gt ? proximas : pasadas;
  }

  const findMany = vi.fn(
    ({
      where,
      orderBy,
      skip = 0,
      take,
    }: {
      where: WhereReserva;
      orderBy: { classroom: { scheduledAt: 'asc' | 'desc' } };
      skip?: number;
      take: number;
    }) => {
      const ordenadas = [...filasDe(where)].sort((a, b) => {
        const diferencia = a.classroom.scheduledAt.getTime() - b.classroom.scheduledAt.getTime();
        return orderBy.classroom.scheduledAt === 'asc' ? diferencia : -diferencia;
      });
      return Promise.resolve(ordenadas.slice(skip, skip + take));
    },
  );

  const count = vi.fn(({ where }: { where: WhereReserva }) =>
    Promise.resolve(filasDe(where).length),
  );

  const prisma = { booking: { findMany, count } } as unknown as PrismaService;
  const notifications = { notify: vi.fn() } as unknown as NotificationService;

  return { service: new BookingsService(prisma, notifications, CONFIG), findMany, count };
}

function wheresDeReservas(...espias: ReturnType<typeof vi.fn>[]): WhereReserva[] {
  return espias.flatMap((espia) =>
    espia.mock.calls.map((llamada) => (llamada[0] as { where: WhereReserva }).where),
  );
}

const AYER = '2020-08-11T23:00:00.000Z';
const ANTEAYER = '2020-08-10T23:00:00.000Z';
const PRONTO = '2099-08-12T23:00:00.000Z';
const MAS_TARDE = '2099-09-12T23:00:00.000Z';

describe('BookingsService.listMisReservas — alcance (AC3)', () => {
  it('acota SIEMPRE al estudiante del token, en todas las consultas', async () => {
    const { service, findMany, count } = setupMisReservas({
      proximas: [filaReserva('a', PRONTO)],
    });

    await service.listMisReservas(ESTUDIANTE, {});

    const wheres = wheresDeReservas(findMany, count);
    expect(wheres.length).toBeGreaterThan(0);
    for (const where of wheres) {
      expect(where.studentId).toBe(ESTUDIANTE.id);
    }
  });

  it('ignora un studentId colado en el query: nunca lee las reservas de otro', async () => {
    const { service, findMany, count } = setupMisReservas({
      proximas: [filaReserva('a', PRONTO)],
    });
    const conIntruso = { studentId: OTRO_ESTUDIANTE_ID } as ListMisReservasDto;

    await service.listMisReservas(ESTUDIANTE, conIntruso);

    for (const where of wheresDeReservas(findMany, count)) {
      expect(where.studentId).toBe(ESTUDIANTE.id);
      expect(where.studentId).not.toBe(OTRO_ESTUDIANTE_ID);
    }
  });
});

describe('BookingsService.listMisReservas — filtro temporal disjunto (AC1, AC2)', () => {
  it('sin filtro devuelve las tres, próximas ascendente y el historial descendente', async () => {
    const { service } = setupMisReservas({
      proximas: [filaReserva('lejana', MAS_TARDE), filaReserva('cercana', PRONTO)],
      pasadas: [filaReserva('ayer', AYER)],
      canceladas: [reservaCancelada('cancelada', ANTEAYER)],
    });

    const resultado = await service.listMisReservas(ESTUDIANTE, {});

    expect(resultado.total).toBe(4);
    expect(resultado.items.map((item) => item.id)).toEqual([
      'cercana',
      'lejana',
      'ayer',
      'cancelada',
    ]);
  });

  it('el filtro proximas deja fuera las pasadas y las canceladas', async () => {
    const { service } = setupMisReservas({
      proximas: [filaReserva('proxima', PRONTO)],
      pasadas: [filaReserva('pasada', AYER)],
      canceladas: [reservaCancelada('cancelada', MAS_TARDE)],
    });

    const resultado = await service.listMisReservas(ESTUDIANTE, {
      estado: EstadoTemporalAula.PROXIMAS,
    });

    expect(resultado.items.map((item) => item.id)).toEqual(['proxima']);
    expect(resultado.total).toBe(1);
  });

  it('el filtro pasadas devuelve solo lo ya impartido, lo más reciente primero', async () => {
    const { service } = setupMisReservas({
      pasadas: [filaReserva('anteayer', ANTEAYER), filaReserva('ayer', AYER)],
    });

    const resultado = await service.listMisReservas(ESTUDIANTE, {
      estado: EstadoTemporalAula.PASADAS,
    });

    expect(resultado.items.map((item) => item.id)).toEqual(['ayer', 'anteayer']);
  });

  /**
   * AC2 — el estado gana sobre la fecha: una clase cancelada del mes que
   * viene sale en `canceladas`, no en `proximas`.
   */
  it('el filtro canceladas incluye las de fecha futura, y solo esas', async () => {
    const { service } = setupMisReservas({
      proximas: [filaReserva('proxima', PRONTO)],
      canceladas: [
        reservaCancelada('cancelada-futura', MAS_TARDE),
        reservaCancelada('cancelada-vieja', AYER),
      ],
    });

    const resultado = await service.listMisReservas(ESTUDIANTE, {
      estado: EstadoTemporalAula.CANCELADAS,
    });

    expect(resultado.items.map((item) => item.id)).toEqual(['cancelada-futura', 'cancelada-vieja']);
  });

  it('los tres filtros suman el total de todas y ninguna reserva sale dos veces', async () => {
    const grupos = {
      proximas: [filaReserva('proxima', PRONTO)],
      pasadas: [filaReserva('pasada', AYER)],
      canceladas: [reservaCancelada('cancelada', MAS_TARDE)],
    };

    const [todas, proximas, pasadas, canceladas] = await Promise.all([
      setupMisReservas(grupos).service.listMisReservas(ESTUDIANTE, {}),
      setupMisReservas(grupos).service.listMisReservas(ESTUDIANTE, {
        estado: EstadoTemporalAula.PROXIMAS,
      }),
      setupMisReservas(grupos).service.listMisReservas(ESTUDIANTE, {
        estado: EstadoTemporalAula.PASADAS,
      }),
      setupMisReservas(grupos).service.listMisReservas(ESTUDIANTE, {
        estado: EstadoTemporalAula.CANCELADAS,
      }),
    ]);

    expect(proximas.total + pasadas.total + canceladas.total).toBe(todas.total);

    const idsSueltos = [...proximas.items, ...pasadas.items, ...canceladas.items].map(
      (item) => item.id,
    );
    expect(new Set(idsSueltos).size).toBe(idsSueltos.length);
    expect(idsSueltos.sort()).toEqual(todas.items.map((item) => item.id).sort());
  });
});

describe('BookingsService.listMisReservas — paginación', () => {
  it('usa página 1 y el tamaño por defecto, y devuelve el formato del catálogo', async () => {
    const { service } = setupMisReservas({ proximas: [filaReserva('a', PRONTO)] });

    const resultado = await service.listMisReservas(ESTUDIANTE, {});

    expect(resultado).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    expect(Object.keys(resultado).sort()).toEqual(['items', 'page', 'pageSize', 'total']);
  });

  it('una página a caballo entre los dos bloques no duplica ni pierde filas', async () => {
    const grupos = {
      proximas: [filaReserva('cercana', PRONTO), filaReserva('lejana', MAS_TARDE)],
      pasadas: [filaReserva('ayer', AYER), filaReserva('anteayer', ANTEAYER)],
    };

    const primera = await setupMisReservas(grupos).service.listMisReservas(ESTUDIANTE, {
      pageSize: 3,
    });
    const segunda = await setupMisReservas(grupos).service.listMisReservas(ESTUDIANTE, {
      page: 2,
      pageSize: 3,
    });

    expect(primera.items.map((item) => item.id)).toEqual(['cercana', 'lejana', 'ayer']);
    expect(segunda.items.map((item) => item.id)).toEqual(['anteayer']);
  });
});

// AC4 — `meetingLink` no viaja en el listado, ni siquiera al confirmado.
describe('BookingsService.listMisReservas — el enlace nunca viaja (AC4)', () => {
  it('ninguna reserva trae meetingLink, ni cifrado ni en claro', async () => {
    const { service } = setupMisReservas({
      proximas: [filaReserva('proxima', PRONTO)],
      pasadas: [filaReserva('pasada', AYER)],
      canceladas: [reservaCancelada('cancelada', ANTEAYER)],
    });

    const resultado = await service.listMisReservas(ESTUDIANTE, {});

    expect(resultado.items).toHaveLength(3);
    for (const item of resultado.items) {
      expect(item).not.toHaveProperty('meetingLink');
    }
    expect(JSON.stringify(resultado)).not.toContain('v1.iv.tag.texto');
  });

  it('trae el nombre del profesor y el myBookingStatus propio', async () => {
    const { service } = setupMisReservas({ proximas: [filaReserva('proxima', PRONTO)] });

    const resultado = await service.listMisReservas(ESTUDIANTE, {});

    expect(resultado.items[0]).toMatchObject({
      teacherFirstName: 'Paula',
      teacherLastName: 'Profesora',
      myBookingStatus: 'CONFIRMED',
    });
  });
});
