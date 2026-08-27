import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, BookingStatus, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BookingsController } from './bookings.controller';
import type { BookingsService } from './bookings.service';
import type { CreateBookingDto } from './dto/create-booking.dto';

const estudiante: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'sofia@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

/** Contexto de ejecución para el `RolesGuard` sobre el controlador entero. */
function contextoDeRol(role: UserRole): ExecutionContext {
  const user: AuthenticatedUser = {
    id: `id-${role}`,
    email: 'u@academia.local',
    role,
    status: UserStatus.ACTIVE,
  };

  return {
    getHandler: () => BookingsController.prototype.create,
    getClass: () => BookingsController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('BookingsController.create — POST /bookings (HU-301)', () => {
  it('pasa al servicio el usuario del token y el cuerpo', async () => {
    const createBooking = vi.fn().mockResolvedValue({
      booking: { id: 'x', status: BookingStatus.CONFIRMED },
    });
    const controller = new BookingsController({ createBooking } as unknown as BookingsService);
    const dto = { classroomId: '22222222-2222-4222-8222-222222222222' } as CreateBookingDto;

    await controller.create(estudiante, dto);

    expect(createBooking).toHaveBeenCalledWith(estudiante, dto);
    expect(createBooking.mock.calls[0]?.[0]).toBe(estudiante);
  });

  it('devuelve `{ booking }` tal cual lo resuelve el servicio', async () => {
    const respuesta = { booking: { id: 'x', status: BookingStatus.CONFIRMED } };
    const createBooking = vi.fn().mockResolvedValue(respuesta);
    const controller = new BookingsController({ createBooking } as unknown as BookingsService);

    await expect(
      controller.create(estudiante, { classroomId: 'x' } as CreateBookingDto),
    ).resolves.toEqual(respuesta);
  });

  /**
   * AC4 — `@Roles(STUDENT)` está en la CLASE, no en el método (el módulo
   * entero es del estudiante). El guard real, leyendo el metadato de verdad.
   */
  describe('autorización por rol (AC4)', () => {
    const guard = new RolesGuard(new Reflector());

    it('deja pasar a STUDENT', () => {
      expect(guard.canActivate(contextoDeRol(UserRole.STUDENT))).toBe(true);
    });

    it.each([UserRole.TEACHER, UserRole.ADMIN])('responde 403 INSUFFICIENT_ROLE a %s', (role) => {
      try {
        guard.canActivate(contextoDeRol(role));
        throw new Error('Se esperaba un 403 y el guard dejó pasar.');
      } catch (error) {
        const excepcion = error as {
          getStatus?: () => number;
          getResponse?: () => { code: string };
        };
        expect(excepcion.getStatus?.()).toBe(403);
        expect(excepcion.getResponse?.().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
      }
    });
  });
});

describe('BookingsController.listMias — GET /bookings/mias (HU-302)', () => {
  it('pasa al servicio el usuario del token y el query', async () => {
    const listMisReservas = vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const controller = new BookingsController({ listMisReservas } as unknown as BookingsService);
    const query = { estado: 'proximas' } as never;

    await controller.listMias(estudiante, query);

    expect(listMisReservas).toHaveBeenCalledWith(estudiante, query);
  });

  it('devuelve la respuesta tal cual la resuelve el servicio', async () => {
    const respuesta = { items: [], total: 0, page: 1, pageSize: 20 };
    const listMisReservas = vi.fn().mockResolvedValue(respuesta);
    const controller = new BookingsController({ listMisReservas } as unknown as BookingsService);

    await expect(controller.listMias(estudiante, {} as never)).resolves.toEqual(respuesta);
  });

  /**
   * `@Roles(STUDENT)` sigue en la clase (AC3): mismo guard, mismo metadato,
   * el `describe` de arriba ya lo cubre para todo el controlador.
   */
  describe('autorización por rol (AC3)', () => {
    const guard = new RolesGuard(new Reflector());

    function contextoMias(role: UserRole): ExecutionContext {
      const user: AuthenticatedUser = {
        id: `id-${role}`,
        email: 'u@academia.local',
        role,
        status: UserStatus.ACTIVE,
      };

      return {
        getHandler: () => BookingsController.prototype.listMias,
        getClass: () => BookingsController,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      } as unknown as ExecutionContext;
    }

    it('deja pasar a STUDENT', () => {
      expect(guard.canActivate(contextoMias(UserRole.STUDENT))).toBe(true);
    });

    it.each([UserRole.TEACHER, UserRole.ADMIN])('responde 403 INSUFFICIENT_ROLE a %s', (role) => {
      try {
        guard.canActivate(contextoMias(role));
        throw new Error('Se esperaba un 403 y el guard dejó pasar.');
      } catch (error) {
        const excepcion = error as {
          getStatus?: () => number;
          getResponse?: () => { code: string };
        };
        expect(excepcion.getStatus?.()).toBe(403);
        expect(excepcion.getResponse?.().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
      }
    });
  });
});
