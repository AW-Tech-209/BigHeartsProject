import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { Prisma } from '@prisma/client';
import { ClassroomStatus } from '@academia/types';

import { AppConfigService } from '../config/app-config.service';
import {
  type Notification,
  NotificationService,
  NotificationType,
} from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';

const REMINDER_24H_MINUTES = 24 * 60;
const INTERVAL_NAME = 'recordatorios-de-clase';
/** Tope por barrido: un pico se reparte entre ciclos en vez de bloquear uno solo. */
const LIMITE_POR_BARRIDO = 500;

const RESERVA_SELECT = {
  id: true,
  student: { select: { email: true, firstName: true } },
  classroom: { select: { id: true, title: true, scheduledAt: true, durationMinutes: true } },
} satisfies Prisma.BookingSelect;

type ReservaParaRecordar = Prisma.BookingGetPayload<{ select: typeof RESERVA_SELECT }>;

/**
 * Barrido periódico de recordatorios (HU-402, `ARQUITECTURA.md` §4.6).
 *
 * Busca reservas `CONFIRMED` con la marca de aviso vacía y la clase dentro de
 * la ventana; envía y solo entonces escribe la marca, así el barrido es
 * idempotente si el proceso se reinicia a mitad. **Con más de una instancia de
 * la API esto duplica correos**: hoy Render corre una sola (§4.6); si eso
 * cambia hay que migrar a BullMQ (D11) o poner un lock en base de datos.
 */
@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemindersService.name);
  private barriendo = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly config: AppConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const interval = setInterval(
      () => void this.sweep(),
      this.config.reminderSweepIntervalSeconds * 1000,
    );
    this.schedulerRegistry.addInterval(INTERVAL_NAME, interval);
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist('interval', INTERVAL_NAME)) {
      this.schedulerRegistry.deleteInterval(INTERVAL_NAME);
    }
  }

  /** Un ciclo del barrido. Público para que el cron y los tests lo disparen igual. */
  async sweep(): Promise<void> {
    if (this.barriendo) {
      return;
    }

    this.barriendo = true;
    try {
      await this.barrer24h(new Date());
      await this.barrer30m(new Date());
    } finally {
      this.barriendo = false;
    }
  }

  private async barrer24h(ahora: Date): Promise<void> {
    const limite = new Date(ahora.getTime() + REMINDER_24H_MINUTES * 60_000);
    await this.barrerVentana(
      ahora,
      limite,
      'reminder24hSentAt',
      NotificationType.BOOKING_REMINDER_24H,
    );
  }

  private async barrer30m(ahora: Date): Promise<void> {
    const limite = new Date(ahora.getTime() + this.config.accessWindowMinutes * 60_000);
    await this.barrerVentana(
      ahora,
      limite,
      'reminder30mSentAt',
      NotificationType.BOOKING_REMINDER_30M,
    );
  }

  /**
   * Un barrido: busca reservas pendientes de esta marca dentro de la ventana,
   * envía secuencialmente y marca las que salieron bien en un solo `updateMany`
   * (antes era uno por reserva). `take` acota el peor caso: un pico se reparte
   * entre ciclos de 60 s en vez de bloquear uno solo.
   */
  private async barrerVentana(
    ahora: Date,
    limite: Date,
    marca: 'reminder24hSentAt' | 'reminder30mSentAt',
    tipo:
      typeof NotificationType.BOOKING_REMINDER_24H | typeof NotificationType.BOOKING_REMINDER_30M,
  ): Promise<void> {
    const reservas = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        [marca]: null,
        classroom: {
          status: { not: ClassroomStatus.CANCELLED },
          scheduledAt: { gt: ahora, lte: limite },
        },
      },
      select: RESERVA_SELECT,
      take: LIMITE_POR_BARRIDO,
    });

    const enviadas: string[] = [];
    for (const reserva of reservas) {
      if (await this.enviar(reserva, tipo)) {
        enviadas.push(reserva.id);
      }
    }

    if (enviadas.length > 0) {
      await this.prisma.booking.updateMany({
        where: { id: { in: enviadas }, [marca]: null },
        data: { [marca]: new Date() },
      });
    }
  }

  /** Envía el aviso. Devuelve `false` sin lanzar si `notify()` falla: la marca no se escribe. */
  private async enviar(
    reserva: ReservaParaRecordar,
    tipo:
      typeof NotificationType.BOOKING_REMINDER_24H | typeof NotificationType.BOOKING_REMINDER_30M,
  ): Promise<boolean> {
    const notification: Notification = {
      type: tipo,
      recipient: { email: reserva.student.email, firstName: reserva.student.firstName },
      classroom: {
        title: reserva.classroom.title,
        scheduledAt: reserva.classroom.scheduledAt,
        durationMinutes: reserva.classroom.durationMinutes,
        url: `${this.config.frontendUrl}/aulas/${reserva.classroom.id}`,
      },
    };

    try {
      await this.notifications.notify(notification);
      return true;
    } catch (error) {
      this.logger.error(
        `No se pudo enviar ${tipo} a ${reserva.student.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
