import { type ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminController, idDeProfesor } from './admin.controller';
import type { AdminService } from './admin.service';

function setup() {
  const listPendingTeachers = vi.fn().mockResolvedValue([]);
  const approveTeacher = vi.fn().mockResolvedValue({ id: 'profe', status: UserStatus.ACTIVE });
  const rejectTeacher = vi.fn().mockResolvedValue({ id: 'profe', status: UserStatus.REJECTED });
  const service = {
    listPendingTeachers,
    approveTeacher,
    rejectTeacher,
  } as unknown as AdminService;

  return {
    controller: new AdminController(service),
    listPendingTeachers,
    approveTeacher,
    rejectTeacher,
  };
}

describe('AdminController — forma de las respuestas', () => {
  it('GET /admin/teachers/pending devuelve `{ teachers }`, como declara PendingTeachersResponse', async () => {
    const { controller } = setup();

    await expect(controller.listPending()).resolves.toEqual({ teachers: [] });
  });

  it('POST approve devuelve `{ user }` con el estado ya cambiado', async () => {
    const { controller } = setup();

    await expect(controller.approve('profe')).resolves.toEqual({
      user: { id: 'profe', status: UserStatus.ACTIVE },
    });
  });

  it('POST reject devuelve `{ user }` con el estado ya cambiado', async () => {
    const { controller } = setup();

    await expect(controller.reject('profe')).resolves.toEqual({
      user: { id: 'profe', status: UserStatus.REJECTED },
    });
  });
});

/**
 * AC5 — «nunca un 500». La forma más fácil de provocar uno es un `:id` que no
 * es un UUID: llega a una columna `@db.Uuid` y Postgres lo rechaza. El pipe lo
 * detiene antes y lo traduce al error de dominio.
 */
describe('AdminController — el `:id` de la ruta (AC5)', () => {
  const metadatos = { type: 'param' as const, data: 'id' };

  it.each(['hola', '123', '', 'no-es-un-uuid-en-absoluto'])(
    'un id con forma inválida (%s) responde USER_NOT_FOUND, no un 500',
    async (id) => {
      // `transform` es asíncrono: el rechazo llega por promesa, no por throw.
      await expect(idDeProfesor.transform(id, metadatos)).rejects.toBeInstanceOf(NotFoundException);

      const error = await idDeProfesor.transform(id, metadatos).catch((e: unknown) => e);
      const excepcion = error as NotFoundException;

      expect(excepcion.getStatus()).toBe(404);
      expect((excepcion.getResponse() as { code: string }).code).toBe(ApiErrorCode.USER_NOT_FOUND);
    },
  );

  it('un UUID válido pasa tal cual al controlador', async () => {
    const id = '11111111-1111-4111-8111-111111111111';

    await expect(idDeProfesor.transform(id, metadatos)).resolves.toBe(id);
  });
});

/**
 * AC4 — la autorización, comprobada de punta a punta dentro del backend.
 *
 * Estos tests NO mockean el Reflector: montan el `RolesGuard` real contra la
 * clase `AdminController` real y leen el metadato que `@Roles` dejó de verdad.
 * Es la diferencia entre probar que el guard sabe comparar roles (eso ya está
 * en `roles.guard.spec.ts`) y probar que ESTE controlador está efectivamente
 * protegido. Un `@Roles` que alguien borre de la clase hace fallar esto y nada
 * más — que es exactamente el fallo que no queremos que pase inadvertido.
 */
describe('AdminController — autorización por rol (AC4)', () => {
  const guard = new RolesGuard(new Reflector());

  /** Los tres handlers del controlador, por su nombre en el contrato HTTP. */
  const HANDLERS = [
    ['GET /admin/teachers/pending', AdminController.prototype.listPending],
    ['POST /admin/teachers/:id/approve', AdminController.prototype.approve],
    ['POST /admin/teachers/:id/reject', AdminController.prototype.reject],
  ] as const;

  function contextoPara(handler: unknown, role: UserRole): ExecutionContext {
    const user: AuthenticatedUser = {
      id: `id-${role}`,
      email: 'u@academia.local',
      role,
      status: UserStatus.ACTIVE,
    };

    return {
      getHandler: () => handler,
      getClass: () => AdminController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it.each(HANDLERS)('%s deja pasar a ADMIN', (_ruta, handler) => {
    expect(guard.canActivate(contextoPara(handler, UserRole.ADMIN))).toBe(true);
  });

  it.each(
    HANDLERS.flatMap(([ruta, handler]) =>
      [UserRole.STUDENT, UserRole.TEACHER].map((role) => [ruta, handler, role] as const),
    ),
  )('%s responde 403 a %s', (_ruta, handler, role) => {
    const contexto = contextoPara(handler, role);

    expect(() => guard.canActivate(contexto)).toThrowError();

    try {
      guard.canActivate(contexto);
    } catch (error) {
      const excepcion = error as { getStatus: () => number; getResponse: () => { code: string } };
      expect(excepcion.getStatus()).toBe(403);
      expect(excepcion.getResponse().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
    }
  });
});
