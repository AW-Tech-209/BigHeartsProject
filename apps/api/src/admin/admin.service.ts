import { Injectable, Logger } from '@nestjs/common';
import { type User, UserRole, UserStatus } from '@academia/types';

import {
  type Notification,
  NotificationService,
  NotificationType,
} from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/user.mapper';
import { invalidStatusTransition, teacherNotFound } from './admin.errors';

/** Los dos desenlaces posibles de una solicitud de profesor. */
const RESOLUTION = {
  [UserStatus.ACTIVE]: NotificationType.TEACHER_APPROVED,
  [UserStatus.REJECTED]: NotificationType.TEACHER_REJECTED,
} as const;

type ResolvedStatus = keyof typeof RESOLUTION;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Los profesores que esperan aprobación, del más antiguo al más reciente.
   *
   * El orden es `createdAt` ascendente y eso es una decisión de producto, no un
   * detalle: quien lleva más tiempo bloqueado sale primero. Un profesor
   * `PENDING` no puede entrar a la plataforma, así que la cola es literalmente
   * el tiempo que alguien lleva sin poder trabajar.
   *
   * El filtro por rol y estado vive AQUÍ, no en la pantalla: es lo que garantiza
   * el AC1 de la HU-104 —un estudiante `PENDING` o un profesor `ACTIVE` no
   * aparecen— pase lo que pase en el frontend.
   */
  async listPendingTeachers(): Promise<User[]> {
    const pending = await this.prisma.user.findMany({
      where: { role: UserRole.TEACHER, status: UserStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    return pending.map(toPublicUser);
  }

  /** Aprueba a un profesor: `PENDING → ACTIVE`. A partir de aquí ya puede entrar. */
  async approveTeacher(teacherId: string): Promise<User> {
    return this.resolveTeacher(teacherId, UserStatus.ACTIVE);
  }

  /**
   * Rechaza a un profesor: `PENDING → REJECTED`.
   *
   * No borra la fila ni la manda a `SUSPENDED`: el rechazo es un hecho del
   * historial, y `SUSPENDED` significaría mentirle al usuario sobre una cuenta
   * que nunca estuvo activa (D13).
   */
  async rejectTeacher(teacherId: string): Promise<User> {
    return this.resolveTeacher(teacherId, UserStatus.REJECTED);
  }

  /**
   * El cuerpo común de aprobar y rechazar: validar la transición, escribirla y
   * avisar al profesor.
   *
   * La validación se hace DOS veces, y las dos hacen falta:
   *
   *  1. La lectura previa existe para poder distinguir «ese usuario no existe»
   *     de «existe pero no se puede aprobar» (AC5). Con una sola escritura
   *     condicional los dos casos serían indistinguibles y el administrador
   *     recibiría el error equivocado.
   *  2. El `where` del `update` REPITE las condiciones porque entre la lectura y
   *     la escritura cabe otro administrador. Sin ellas, dos pestañas abiertas
   *     sobre el mismo profesor —una aprobando, otra rechazando— dejarían ganar
   *     a la última en llegar, y ambas dirían que funcionó. Con ellas, la
   *     segunda recibe P2025 y se traduce al conflicto que de verdad ocurrió.
   *
   * No hace falta transacción ni `SELECT … FOR UPDATE`: eso es la invariante de
   * cupos (§4.2), donde hay un contador que leer-modificar-escribir. Aquí solo
   * hay una escritura condicional de una fila, y Postgres ya la hace atómica.
   */
  private async resolveTeacher(teacherId: string, nextStatus: ResolvedStatus): Promise<User> {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });

    if (!teacher) {
      throw teacherNotFound();
    }

    if (teacher.role !== UserRole.TEACHER || teacher.status !== UserStatus.PENDING) {
      throw invalidStatusTransition();
    }

    let updated;
    try {
      updated = await this.prisma.user.update({
        where: { id: teacherId, role: UserRole.TEACHER, status: UserStatus.PENDING },
        data: { status: nextStatus },
      });
    } catch (error) {
      // P2025 aquí solo puede significar que la fila dejó de cumplir el filtro
      // entre la lectura y la escritura. Cualquier otro fallo —conexión caída,
      // constraint— se relanza tal cual: convertirlo en conflicto escondería una
      // incidencia real detrás de un mensaje tranquilizador.
      if (isRecordNotFound(error)) {
        throw invalidStatusTransition();
      }
      throw error;
    }

    await this.notify({
      type: RESOLUTION[nextStatus],
      recipient: { email: updated.email, firstName: updated.firstName },
    });

    return toPublicUser(updated);
  }

  /**
   * Avisa al profesor del desenlace, sin dejar que el aviso tumbe la operación.
   *
   * El estado YA está escrito cuando esto corre. Si el envío falla y el error
   * sube, el administrador ve un error sobre una aprobación que sí ocurrió, y
   * lo racional para él es volver a pulsar — que fallará con
   * `INVALID_STATUS_TRANSITION` y le hará creer que perdió el cambio.
   *
   * El puerto se compromete a no lanzar, pero la garantía se aplica aquí igual:
   * así sigue siendo cierta cuando el Sprint 4 enchufe un adaptador con red de
   * por medio, sin que nadie tenga que acordarse de este razonamiento.
   */
  private async notify(notification: Notification): Promise<void> {
    try {
      await this.notifications.notify(notification);
    } catch (error) {
      this.logger.error(
        `No se pudo notificar ${notification.type} a ${notification.recipient.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

/**
 * ¿Es el error de Prisma «el registro a actualizar no existe»?
 *
 * Se comprueba por el código P2025 y no con `instanceof
 * PrismaClientKnownRequestError`, por el mismo motivo que en `UsersService`:
 * importar la clase del runtime acopla el service al cliente generado y obliga
 * a fabricar errores reales de Prisma en los tests.
 */
function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2025'
  );
}
