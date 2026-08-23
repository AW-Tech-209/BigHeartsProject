import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiErrorCode, ClassroomStatus, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClassroomsController, idDeAula } from './classrooms.controller';
import type { ClassroomsService } from './classrooms.service';
import type { CreateClassroomDto } from './dto/create-classroom.dto';
import type { ListClassroomsDto } from './dto/list-classrooms.dto';
import type { ListMisAulasDto } from './dto/list-mis-aulas.dto';

const profesor: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'paula@academia.local',
  role: UserRole.TEACHER,
  status: UserStatus.ACTIVE,
};

const ID_DEL_AULA = '44444444-4444-4444-8444-444444444444';

function setup() {
  const createClassroom = vi.fn().mockResolvedValue({
    id: '33333333-3333-4333-8333-333333333333',
    status: ClassroomStatus.PUBLISHED,
  });
  const listClassrooms = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  const listMisAulas = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  const getClassroomDetail = vi.fn().mockResolvedValue({
    id: '44444444-4444-4444-8444-444444444444',
    myBookingStatus: null,
  });
  const service = {
    createClassroom,
    listClassrooms,
    listMisAulas,
    getClassroomDetail,
  } as unknown as ClassroomsService;

  return {
    controller: new ClassroomsController(service),
    createClassroom,
    listClassrooms,
    listMisAulas,
    getClassroomDetail,
  };
}

/** Contexto de ejecución para el `RolesGuard`, sobre el handler que se indique. */
function contextoDeRol(handler: (...args: never[]) => unknown, role: UserRole): ExecutionContext {
  const user: AuthenticatedUser = {
    id: `id-${role}`,
    email: 'u@academia.local',
    role,
    status: UserStatus.ACTIVE,
  };

  return {
    getHandler: () => handler,
    getClass: () => ClassroomsController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
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
  const contextoPara = (role: UserRole) =>
    contextoDeRol(ClassroomsController.prototype.create, role);

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

describe('ClassroomsController.list — GET /classrooms (HU-203)', () => {
  it('delega el query en el servicio y devuelve su respuesta tal cual', async () => {
    const { controller, listClassrooms } = setup();
    const respuesta = {
      items: [{ id: '1' }],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    listClassrooms.mockResolvedValue(respuesta);
    const query = { level: 'BEGINNER' } as unknown as ListClassroomsDto;

    await expect(controller.list(profesor, query)).resolves.toEqual(respuesta);
    expect(listClassrooms).toHaveBeenCalledWith(profesor, query);
  });

  /**
   * HU-208, la costura donde se decide el alcance de `?mias=true`. Es el mismo
   * test que vigila `listMias`: si alguien cambiara esta llamada por algo
   * sacado del query, el servicio filtraría por el id que le mandaran y ningún
   * test suyo se pondría rojo.
   */
  it('pasa al servicio el usuario del token, no nada del query', async () => {
    const { controller, listClassrooms } = setup();
    const query = { mias: true, teacherId: 'otro-profesor' } as unknown as ListClassroomsDto;

    await controller.list(profesor, query);

    expect(listClassrooms.mock.calls[0]?.[0]).toBe(profesor);
  });

  /**
   * A diferencia de `create`, el listado no lleva `@Roles`: lo ve cualquier
   * usuario autenticado (estudiante, profesor o administrador). Con el guard
   * real, sin metadato en el handler, `canActivate` deja pasar a los tres.
   */
  it.each([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])(
    'no exige ningún rol concreto: deja pasar a %s',
    (role) => {
      const guard = new RolesGuard(new Reflector());

      expect(guard.canActivate(contextoDeRol(ClassroomsController.prototype.list, role))).toBe(
        true,
      );
    },
  );
});

describe('ClassroomsController.listMias — GET /classrooms/mias (HU-207)', () => {
  /**
   * AC3, en la costura donde se decide: el controlador pasa el usuario del
   * TOKEN. Si alguien cambiara esta llamada por algo sacado del query, el
   * servicio no tendría forma de notarlo — y un profesor leería las aulas de
   * otro sin que ningún test del servicio se pusiera rojo.
   */
  it('pasa al servicio el usuario del token, no nada del query', async () => {
    const { controller, listMisAulas } = setup();
    const query = { estado: 'proximas', teacherId: 'otro-profesor' } as unknown as ListMisAulasDto;

    await controller.listMias(profesor, query);

    expect(listMisAulas).toHaveBeenCalledWith(profesor, query);
    expect(listMisAulas.mock.calls[0]?.[0]).toBe(profesor);
  });

  it('devuelve la respuesta del servicio tal cual, sin envolverla otra vez', async () => {
    const { controller, listMisAulas } = setup();
    const respuesta = { items: [{ id: '1' }], total: 1, page: 1, pageSize: 20 };
    listMisAulas.mockResolvedValue(respuesta);

    await expect(controller.listMias(profesor, {} as ListMisAulasDto)).resolves.toEqual(respuesta);
  });

  describe('autorización por rol (AC4)', () => {
    const guard = new RolesGuard(new Reflector());

    it('deja pasar a TEACHER', () => {
      expect(
        guard.canActivate(contextoDeRol(ClassroomsController.prototype.listMias, UserRole.TEACHER)),
      ).toBe(true);
    });

    /**
     * AC4 para el estudiante, y también para el administrador: «mis aulas» es
     * la vista del dueño, y un administrador no tiene aulas propias. Su vista de
     * supervisión es otro endpoint (`GET /admin/classrooms`, D20).
     */
    it.each([UserRole.STUDENT, UserRole.ADMIN])('responde 403 INSUFFICIENT_ROLE a %s', (role) => {
      try {
        guard.canActivate(contextoDeRol(ClassroomsController.prototype.listMias, role));
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

describe('ClassroomsController.detail — GET /classrooms/:id (HU-204)', () => {
  it('devuelve `{ classroom }`, como declara ClassroomDetailResponse', async () => {
    const { controller } = setup();

    await expect(controller.detail(profesor, ID_DEL_AULA)).resolves.toEqual({
      classroom: { id: ID_DEL_AULA, myBookingStatus: null },
    });
  });

  /**
   * AC2, en la costura donde se decide. El controlador pasa el usuario del
   * TOKEN: es lo único con lo que el servicio puede decidir si el enlace viaja.
   * Si alguien cambiara esta llamada por algo sacado de la ruta o del query,
   * ningún test del servicio se pondría rojo.
   */
  it('pasa al servicio el usuario del token y el id de la ruta', async () => {
    const { controller, getClassroomDetail } = setup();

    await controller.detail(profesor, ID_DEL_AULA);

    expect(getClassroomDetail).toHaveBeenCalledWith(profesor, ID_DEL_AULA);
    expect(getClassroomDetail.mock.calls[0]?.[0]).toBe(profesor);
  });

  /**
   * AC3, primera mitad. Un id malformado **no** puede acabar en un 500: sin el
   * pipe, el literal llega a una columna `@db.Uuid` y Postgres lo rechaza.
   */
  it('traduce un id que no es un uuid a 404 CLASSROOM_NOT_FOUND', async () => {
    try {
      await idDeAula.transform('hola', { type: 'param', data: 'id' });
      throw new Error('Se esperaba un 404 y el pipe dejó pasar el valor.');
    } catch (error) {
      const excepcion = error as { getStatus?: () => number; getResponse?: () => { code: string } };
      expect(excepcion.getStatus?.()).toBe(404);
      expect(excepcion.getResponse?.().code).toBe(ApiErrorCode.CLASSROOM_NOT_FOUND);
    }
  });

  /**
   * Sin `@Roles`: el detalle lo ve cualquier usuario autenticado. Lo que cambia
   * por rol no es el acceso a la pantalla sino un campo —`meetingLink`—, y esa
   * decisión vive en el servicio.
   */
  it.each([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])(
    'no exige ningún rol concreto: deja pasar a %s',
    (role) => {
      const guard = new RolesGuard(new Reflector());

      expect(guard.canActivate(contextoDeRol(ClassroomsController.prototype.detail, role))).toBe(
        true,
      );
    },
  );
});

/**
 * La trampa que `contrato-api.md` §6 documenta y que esta HU podía disparar:
 * **Nest resuelve por orden de registro**, así que un `@Get(':id')` declarado
 * por encima de `@Get('mias')` se tragaría `mias` como si fuera un
 * identificador — y «Mis aulas» empezaría a responder 404 sin que nada más
 * cambiara.
 *
 * El orden de `getOwnPropertyNames` sobre el prototipo es el de declaración, así
 * que esto vigila la posición real de los dos métodos en el archivo.
 */
describe('ClassroomsController — orden de rutas', () => {
  it('declara `mias` ANTES que `:id`', () => {
    const metodos = Object.getOwnPropertyNames(ClassroomsController.prototype);

    expect(metodos.indexOf('listMias')).toBeGreaterThan(-1);
    expect(metodos.indexOf('listMias')).toBeLessThan(metodos.indexOf('detail'));
  });
});
