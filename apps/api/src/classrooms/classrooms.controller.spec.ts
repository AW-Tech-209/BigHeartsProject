import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, ClassroomStatus, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClassroomsController } from './classrooms.controller';
import type { ClassroomsService } from './classrooms.service';
import type { CreateClassroomDto } from './dto/create-classroom.dto';

const profesor: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'paula@academia.local',
  role: UserRole.TEACHER,
  status: UserStatus.ACTIVE,
};

function setup() {
  const createClassroom = vi.fn().mockResolvedValue({
    id: '33333333-3333-4333-8333-333333333333',
    status: ClassroomStatus.PUBLISHED,
  });
  const service = { createClassroom } as unknown as ClassroomsService;

  return { controller: new ClassroomsController(service), createClassroom };
}

describe('ClassroomsController — forma de la respuesta', () => {
  it('POST /classrooms devuelve `{ classroom }`, como declara CreateClassroomResponse', async () => {
    const { controller } = setup();

    await expect(controller.create(profesor, {} as CreateClassroomDto)).resolves.toEqual({
      classroom: { id: '33333333-3333-4333-8333-333333333333', status: ClassroomStatus.PUBLISHED },
    });
  });

  /**
   * AC3, en la costura donde se decide. El controlador pasa el usuario del
   * TOKEN, no un id sacado del cuerpo. Si alguien cambiara esta llamada por
   * `dto.teacherId`, el servicio no tendría forma de notarlo.
   */
  it('pasa al servicio el usuario del token, no nada del cuerpo', async () => {
    const { controller, createClassroom } = setup();
    const cuerpo = { title: 'Clase', teacherId: 'otro-profesor' } as unknown as CreateClassroomDto;

    await controller.create(profesor, cuerpo);

    expect(createClassroom).toHaveBeenCalledWith(profesor, cuerpo);
    expect(createClassroom.mock.calls[0]?.[0]).toBe(profesor);
  });
});

/**
 * AC5 — la autorización por rol, con el `RolesGuard` real leyendo el metadato
 * que `@Roles` dejó de verdad sobre este handler.
 *
 * Que `roles.guard.spec.ts` pruebe que el guard sabe comparar roles no dice
 * nada de si ESTE endpoint está protegido. Borrar el `@Roles` de `create` pone
 * rojo este test y solo este — que es justo el fallo que no puede pasar
 * inadvertido, porque abriría la creación de aulas a cualquier estudiante.
 */
describe('ClassroomsController — autorización por rol (AC5)', () => {
  const guard = new RolesGuard(new Reflector());

  function contextoPara(role: UserRole): ExecutionContext {
    const user: AuthenticatedUser = {
      id: `id-${role}`,
      email: 'u@academia.local',
      role,
      status: UserStatus.ACTIVE,
    };

    return {
      getHandler: () => ClassroomsController.prototype.create,
      getClass: () => ClassroomsController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('deja pasar a TEACHER', () => {
    expect(guard.canActivate(contextoPara(UserRole.TEACHER))).toBe(true);
  });

  /**
   * ADMIN también recibe 403, y es deliberado: administrar la plataforma no es
   * impartir clases. Un aula tiene un profesor dueño que aparece en la tarjeta
   * y al que el estudiante va a ver en la videollamada; un aula a nombre del
   * administrador no significaría nada para quien la reserva.
   */
  it.each([UserRole.STUDENT, UserRole.ADMIN])('responde 403 INSUFFICIENT_ROLE a %s', (role) => {
    const contexto = contextoPara(role);

    try {
      guard.canActivate(contexto);
      throw new Error('Se esperaba un 403 y el guard dejó pasar.');
    } catch (error) {
      const excepcion = error as { getStatus?: () => number; getResponse?: () => { code: string } };
      expect(excepcion.getStatus?.()).toBe(403);
      expect(excepcion.getResponse?.().code).toBe(ApiErrorCode.INSUFFICIENT_ROLE);
    }
  });
});
