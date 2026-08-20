import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationService, NotificationType } from '../notifications/notification.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

/** Usuario "de BD" (entidad Prisma), con contraseña incluida. */
function dbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'paula@academia.local',
    password: 'hashed:Password123',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: UserRole.TEACHER,
    status: UserStatus.PENDING,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** El error que Prisma lanza cuando el `where` del update no encuentra fila. */
const P2025 = Object.assign(new Error('Record to update not found.'), { code: 'P2025' });

function setup(
  options: {
    found?: ReturnType<typeof dbUser> | null;
    findMany?: ReturnType<typeof dbUser>[];
    updateThrows?: unknown;
    notifyThrows?: boolean;
  } = {},
) {
  const findUnique = vi.fn().mockResolvedValue('found' in options ? options.found : dbUser());
  const findMany = vi.fn().mockResolvedValue(options.findMany ?? []);
  const update = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    if (options.updateThrows) throw options.updateThrows;
    return Promise.resolve(dbUser(data));
  });

  const prisma = { user: { findUnique, findMany, update } } as unknown as PrismaService;

  const notify = vi.fn().mockImplementation(() => {
    if (options.notifyThrows) return Promise.reject(new Error('proveedor caído'));
    return Promise.resolve({ delivered: false, channel: 'log' as const });
  });
  const notifications = { notify } as unknown as NotificationService;

  return { service: new AdminService(prisma, notifications), findUnique, findMany, update, notify };
}

/** Extrae el `code` del cuerpo de la excepción: es lo que ve el frontend. */
async function codigoDe(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const body = (error as NotFoundException).getResponse() as { code: string };
    return body.code;
  }
  throw new Error('Se esperaba una excepción y no hubo ninguna.');
}

beforeEach(() => vi.clearAllMocks());

describe('AdminService.listPendingTeachers', () => {
  // AC1: el filtro es del servidor. Si esta consulta se relaja, un estudiante
  // PENDING aparecería en una pantalla de aprobación de profesores.
  it('consulta solo TEACHER + PENDING, ordenados por createdAt ascendente', async () => {
    const { service, findMany } = setup();

    await service.listPendingTeachers();

    expect(findMany).toHaveBeenCalledWith({
      where: { role: UserRole.TEACHER, status: UserStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('devuelve la vista pública, sin el hash de la contraseña', async () => {
    const { service } = setup({ findMany: [dbUser()] });

    const [teacher] = await service.listPendingTeachers();

    expect(teacher).not.toHaveProperty('password');
    expect(teacher?.email).toBe('paula@academia.local');
  });

  it('devuelve una lista vacía cuando no hay nadie esperando', async () => {
    const { service } = setup({ findMany: [] });

    await expect(service.listPendingTeachers()).resolves.toEqual([]);
  });
});

describe('AdminService.approveTeacher', () => {
  it('cambia el estado a ACTIVE (AC2)', async () => {
    const { service, update } = setup();

    const user = await service.approveTeacher('11111111-1111-4111-8111-111111111111');

    expect(update).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-4111-8111-111111111111',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
      },
      data: { status: UserStatus.ACTIVE },
    });
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  // AC6: el destinatario y el tipo de evento, verificados con espía.
  it('notifica TEACHER_APPROVED al profesor aprobado', async () => {
    const { service, notify } = setup();

    await service.approveTeacher('11111111-1111-4111-8111-111111111111');

    expect(notify).toHaveBeenCalledWith({
      type: NotificationType.TEACHER_APPROVED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });
  });
});

describe('AdminService.rejectTeacher', () => {
  it('cambia el estado a REJECTED, no a SUSPENDED (AC3, D13)', async () => {
    const { service, update } = setup();

    const user = await service.rejectTeacher('11111111-1111-4111-8111-111111111111');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: UserStatus.REJECTED } }),
    );
    expect(user.status).toBe(UserStatus.REJECTED);
  });

  it('no borra la fila: el rechazo es historial', async () => {
    const { service } = setup();
    // El service no tiene acceso a `delete` en el mock; si algún día lo usara,
    // este test fallaría con "delete is not a function" en vez de pasar en silencio.
    await expect(
      service.rejectTeacher('11111111-1111-4111-8111-111111111111'),
    ).resolves.toBeDefined();
  });

  it('notifica TEACHER_REJECTED al profesor rechazado', async () => {
    const { service, notify } = setup();

    await service.rejectTeacher('11111111-1111-4111-8111-111111111111');

    expect(notify).toHaveBeenCalledWith({
      type: NotificationType.TEACHER_REJECTED,
      recipient: { email: 'paula@academia.local', firstName: 'Paula' },
    });
  });
});

/**
 * AC5 — ninguno de estos casos puede acabar en 500, y cada uno tiene que
 * distinguirse del otro: «no existe» y «no se puede» le piden al administrador
 * cosas distintas.
 */
describe('AdminService — transiciones inválidas (AC5)', () => {
  it.each([['approveTeacher' as const], ['rejectTeacher' as const]])(
    '%s responde USER_NOT_FOUND si el id no existe',
    async (metodo) => {
      const { service, update } = setup({ found: null });

      await expect(service[metodo]('11111111-1111-4111-8111-111111111111')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(update).not.toHaveBeenCalled();

      const { service: otro } = setup({ found: null });
      await expect(codigoDe(otro[metodo]('11111111-1111-4111-8111-111111111111'))).resolves.toBe(
        ApiErrorCode.USER_NOT_FOUND,
      );
    },
  );

  it('rechaza aprobar a quien no es profesor', async () => {
    const { service, update } = setup({ found: dbUser({ role: UserRole.STUDENT }) });

    await expect(
      service.approveTeacher('11111111-1111-4111-8111-111111111111'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([UserStatus.ACTIVE, UserStatus.REJECTED, UserStatus.SUSPENDED])(
    'rechaza aprobar a un profesor que ya está %s',
    async (status) => {
      const { service } = setup({ found: dbUser({ status }) });

      await expect(
        codigoDe(service.approveTeacher('11111111-1111-4111-8111-111111111111')),
      ).resolves.toBe(ApiErrorCode.INVALID_STATUS_TRANSITION);
    },
  );

  it('no notifica cuando la transición es inválida', async () => {
    const { service, notify } = setup({ found: dbUser({ status: UserStatus.ACTIVE }) });

    await service.approveTeacher('11111111-1111-4111-8111-111111111111').catch(() => undefined);

    expect(notify).not.toHaveBeenCalled();
  });

  /**
   * La carrera real: dos administradores con la lista abierta, uno aprueba y el
   * otro rechaza. El segundo pasa la lectura previa (todavía veía PENDING) y es
   * el `where` del update quien lo detiene.
   */
  it('traduce el P2025 del update a INVALID_STATUS_TRANSITION (otro admin llegó antes)', async () => {
    const { service } = setup({ updateThrows: P2025 });

    await expect(
      codigoDe(service.approveTeacher('11111111-1111-4111-8111-111111111111')),
    ).resolves.toBe(ApiErrorCode.INVALID_STATUS_TRANSITION);
  });

  it('relanza cualquier otro fallo de Prisma en vez de disfrazarlo de conflicto', async () => {
    const caida = Object.assign(new Error('connection refused'), { code: 'P1001' });
    const { service } = setup({ updateThrows: caida });

    await expect(service.approveTeacher('11111111-1111-4111-8111-111111111111')).rejects.toThrow(
      'connection refused',
    );
  });
});

describe('AdminService — la notificación no tumba la operación', () => {
  it('devuelve el profesor aprobado aunque el aviso falle', async () => {
    // El service registra el fallo, y ese `error` es ruido esperado en la salida
    // de los tests: se silencia para que un error de verdad siga destacando.
    const registro = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { service } = setup({ notifyThrows: true });

    const user = await service.approveTeacher('11111111-1111-4111-8111-111111111111');

    expect(registro).toHaveBeenCalledOnce();

    // El estado ya está escrito: propagar el fallo del aviso haría que el
    // administrador reintentara una aprobación que sí ocurrió.
    expect(user.status).toBe(UserStatus.ACTIVE);
  });
});
