import type { SchedulerRegistry } from '@nestjs/schedule';
import { ClassroomStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import type { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.service';
import type { PrismaService } from '../prisma/prisma.service';
import { RemindersService } from './reminders.service';

const CONFIG = {
  accessWindowMinutes: 30,
  frontendUrl: 'https://academia-web.vercel.app',
  reminderSweepIntervalSeconds: 60,
} as unknown as AppConfigService;

interface ReservaFake {
  id: string;
  status: 'CONFIRMED' | 'CANCELLED';
  reminder24hSentAt: Date | null;
  reminder30mSentAt: Date | null;
  student: { email: string; firstName: string };
  classroom: {
    id: string;
    status: string;
    title: string;
    scheduledAt: Date;
    durationMinutes: number;
  };
}

function reserva(overrides: Partial<ReservaFake> = {}): ReservaFake {
  return {
    id: 'booking-1',
    status: 'CONFIRMED',
    reminder24hSentAt: null,
    reminder30mSentAt: null,
    student: { email: 'ana@academia.local', firstName: 'Ana' },
    classroom: {
      id: 'aula-1',
      status: ClassroomStatus.PUBLISHED,
      title: 'Inglés A1',
      scheduledAt: new Date('2026-09-01T12:00:00.000Z'),
      durationMinutes: 60,
    },
    ...overrides,
  };
}

/** Fake con estado real: filtra y escribe marcas como lo haría Postgres, para probar la idempotencia de verdad. */
function fakePrisma(reservas: ReservaFake[]) {
  const findMany = vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
    const marca: 'reminder24hSentAt' | 'reminder30mSentAt' =
      'reminder24hSentAt' in where ? 'reminder24hSentAt' : 'reminder30mSentAt';
    const classroomWhere = where.classroom as { scheduledAt: { gt: Date; lte: Date } };
    const rango = classroomWhere.scheduledAt;

    return reservas
      .filter(
        (r) =>
          r.status === 'CONFIRMED' &&
          r[marca] === null &&
          r.classroom.status !== ClassroomStatus.CANCELLED &&
          r.classroom.scheduledAt > rango.gt &&
          r.classroom.scheduledAt <= rango.lte,
      )
      .map((r) => ({
        id: r.id,
        student: r.student,
        classroom: {
          id: r.classroom.id,
          title: r.classroom.title,
          scheduledAt: r.classroom.scheduledAt,
          durationMinutes: r.classroom.durationMinutes,
        },
      }));
  });

  const updateMany = vi.fn(
    async ({ where, data }: { where: Record<string, unknown>; data: Partial<ReservaFake> }) => {
      const marca: 'reminder24hSentAt' | 'reminder30mSentAt' =
        'reminder24hSentAt' in where ? 'reminder24hSentAt' : 'reminder30mSentAt';
      const r = reservas.find((x) => x.id === where.id && x[marca] === null);

      if (!r) {
        return { count: 0 };
      }

      Object.assign(r, data);
      return { count: 1 };
    },
  );

  return { booking: { findMany, updateMany } } as unknown as PrismaService;
}

const SCHEDULER_REGISTRY = {
  addInterval: vi.fn(),
  doesExist: vi.fn().mockReturnValue(false),
  deleteInterval: vi.fn(),
} as unknown as SchedulerRegistry;

function setup(reservas: ReservaFake[], notify = vi.fn().mockResolvedValue({ delivered: true })) {
  const prisma = fakePrisma(reservas);
  const notifications = { notify } as unknown as NotificationService;
  const service = new RemindersService(prisma, notifications, CONFIG, SCHEDULER_REGISTRY);

  return { service, notify, reservas };
}

const AHORA = new Date('2026-09-01T00:00:00.000Z');

describe('RemindersService.sweep', () => {
  it('AC1 — una reserva en ventana recibe el recordatorio de 24h y el de 30 min, cada uno con su marca', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      classroom: { ...reserva().classroom, scheduledAt: new Date(AHORA.getTime() + 20 * 60_000) },
    });
    const { service, notify } = setup([r]);

    await service.sweep();

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.BOOKING_REMINDER_24H }),
    );
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.BOOKING_REMINDER_30M }),
    );
    expect(r.reminder24hSentAt).not.toBeNull();
    expect(r.reminder30mSentAt).not.toBeNull();
    vi.useRealTimers();
  });

  it('AC2 — dos barridos seguidos no duplican el envío', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      classroom: { ...reserva().classroom, scheduledAt: new Date(AHORA.getTime() + 20 * 60_000) },
    });
    const { service, notify } = setup([r]);

    await service.sweep();
    await service.sweep();

    expect(notify).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('AC3 — una reserva CANCELLED no recibe nada', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      status: 'CANCELLED',
      classroom: { ...reserva().classroom, scheduledAt: new Date(AHORA.getTime() + 20 * 60_000) },
    });
    const { service, notify } = setup([r]);

    await service.sweep();

    expect(notify).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('AC3 — un aula CANCELLED no recibe nada', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      classroom: {
        ...reserva().classroom,
        status: ClassroomStatus.CANCELLED,
        scheduledAt: new Date(AHORA.getTime() + 20 * 60_000),
      },
    });
    const { service, notify } = setup([r]);

    await service.sweep();

    expect(notify).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('AC3 — una clase que ya empezó no recibe nada', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      classroom: { ...reserva().classroom, scheduledAt: new Date(AHORA.getTime() - 5 * 60_000) },
    });
    const { service, notify } = setup([r]);

    await service.sweep();

    expect(notify).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('AC5 — un fallo del proveedor no deja la marca escrita: el siguiente barrido reintenta', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      classroom: { ...reserva().classroom, scheduledAt: new Date(AHORA.getTime() + 20 * 60_000) },
    });
    const notify = vi.fn().mockRejectedValue(new Error('Resend caído'));
    const { service } = setup([r], notify);

    await service.sweep();

    expect(r.reminder24hSentAt).toBeNull();
    expect(r.reminder30mSentAt).toBeNull();

    notify.mockResolvedValue({ delivered: true });
    await service.sweep();

    expect(r.reminder24hSentAt).not.toBeNull();
    expect(r.reminder30mSentAt).not.toBeNull();
    vi.useRealTimers();
  });

  it('el recordatorio de 30 min enlaza a la pantalla del aula, no lleva el enlace de la videollamada', async () => {
    vi.setSystemTime(AHORA);
    const r = reserva({
      classroom: { ...reserva().classroom, scheduledAt: new Date(AHORA.getTime() + 20 * 60_000) },
    });
    const { service, notify } = setup([r]);

    await service.sweep();

    const llamada = notify.mock.calls.find(
      ([n]) => n.type === NotificationType.BOOKING_REMINDER_30M,
    );
    expect(llamada![0].classroom.url).toBe('https://academia-web.vercel.app/aulas/aula-1');
    expect(llamada![0]).not.toHaveProperty('meetingLink');
    vi.useRealTimers();
  });
});
