import { ApiErrorCode, ClassroomStatus, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import type { NotificationService } from '../notifications/notification.service';
import type { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';
import type { CreateBookingDto } from './dto/create-booking.dto';

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
    service: new BookingsService(prisma, notifications),
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
    const service = new BookingsService(prisma, notifications);

    const OTRO_ESTUDIANTE: AuthenticatedUser = { ...ESTUDIANTE, id: 'otro-estudiante' };

    await service.createBooking(ESTUDIANTE, dto);
    const segundoCodigo = await codigoDeError(service.createBooking(OTRO_ESTUDIANTE, dto));

    expect(segundoCodigo).toBe(ApiErrorCode.CLASSROOM_FULL);
    expect(estado.current_bookings).toBe(1);
  });
});
