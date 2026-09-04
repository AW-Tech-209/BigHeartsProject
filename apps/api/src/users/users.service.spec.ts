import {
  ApiErrorCode,
  CommunicationPreference,
  HearingLossLevel,
  UserRole,
  UserStatus,
} from '@academia/types';
import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

/** Usuario "de BD" (entidad Prisma), con `password`, como lo devuelve Prisma. */
function dbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    email: 'user@academia.local',
    password: 'hashed:Password123',
    firstName: 'Nombre',
    lastName: 'Apellido',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Construye un UsersService con Prisma mockeado. */
function setup(options: { foundUser?: ReturnType<typeof dbUser> | null } = {}) {
  const found = 'foundUser' in options ? options.foundUser : dbUser();

  const findUnique = vi.fn().mockResolvedValue(found);
  // `update` devuelve la fila con los cambios aplicados, como haría Prisma.
  const update = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    if (!found) {
      return Promise.reject(
        Object.assign(new Error('Record to update not found.'), { code: 'P2025' }),
      );
    }
    return Promise.resolve({ ...found, ...data, updatedAt: new Date('2026-02-01T00:00:00.000Z') });
  });

  const prisma = { user: { findUnique, update } } as unknown as PrismaService;

  return { service: new UsersService(prisma), findUnique, update };
}

/** DTO válido mínimo, como lo entregaría el ValidationPipe. */
function dto(overrides: Partial<UpdateProfileDto> = {}): UpdateProfileDto {
  return { firstName: 'Nuevo', lastName: 'Apellido', ...overrides } as UpdateProfileDto;
}

describe('UsersService.getProfile', () => {
  it('devuelve el perfil del id pedido', async () => {
    const { service, findUnique } = setup();

    const user = await service.getProfile('user-id');

    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    expect(user.id).toBe('user-id');
    expect(user.firstName).toBe('Nombre');
  });

  it('NUNCA incluye la contraseña ni campos fuera del tipo User (AC1)', async () => {
    const { service } = setup();

    const user = await service.getProfile('user-id');

    expect(user).not.toHaveProperty('password');
    // El contrato es cerrado: exactamente estas claves, ni una más.
    expect(Object.keys(user).sort()).toEqual(
      [
        'communicationPreference',
        'createdAt',
        'email',
        'firstName',
        'hearingLossLevel',
        'id',
        'lastName',
        'role',
        'status',
        'updatedAt',
      ].sort(),
    );
  });

  it('serializa las fechas como cadenas ISO', async () => {
    const { service } = setup();

    const user = await service.getProfile('user-id');

    expect(user.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('lanza 404 USER_NOT_FOUND si la cuenta del token ya no existe', async () => {
    const { service } = setup({ foundUser: null });

    await expect(service.getProfile('user-id')).rejects.toThrow(NotFoundException);
    await expect(service.getProfile('user-id')).rejects.toMatchObject({
      response: { code: ApiErrorCode.USER_NOT_FOUND },
    });
  });
});

describe('UsersService.updateProfile', () => {
  it('actualiza nombre y apellidos y devuelve el perfil ya cambiado', async () => {
    const { service, update } = setup();

    const user = await service.updateProfile(
      'user-id',
      UserRole.STUDENT,
      dto({ firstName: 'Ana', lastName: 'Ruiz' }),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { firstName: 'Ana', lastName: 'Ruiz' },
    });
    expect(user.firstName).toBe('Ana');
    expect(user.lastName).toBe('Ruiz');
  });

  it('actualiza las preferencias de accesibilidad cuando llegan', async () => {
    const { service, update } = setup();

    const user = await service.updateProfile(
      'user-id',
      UserRole.STUDENT,
      dto({
        hearingLossLevel: HearingLossLevel.SEVERE,
        communicationPreference: CommunicationPreference.SIGN_LANGUAGE,
      }),
    );

    expect(update.mock.calls[0]![0].data).toMatchObject({
      hearingLossLevel: HearingLossLevel.SEVERE,
      communicationPreference: CommunicationPreference.SIGN_LANGUAGE,
    });
    expect(user.hearingLossLevel).toBe(HearingLossLevel.SEVERE);
  });

  it('actualización parcial: omitir una preferencia NO la borra', async () => {
    const { service, update } = setup({
      foundUser: dbUser({
        hearingLossLevel: HearingLossLevel.MILD,
        communicationPreference: CommunicationPreference.LIP_READING,
      }),
    });

    await service.updateProfile('user-id', UserRole.STUDENT, dto());

    const data = update.mock.calls[0]![0].data;
    expect(data).not.toHaveProperty('hearingLossLevel');
    expect(data).not.toHaveProperty('communicationPreference');
  });

  it('`null` explícito SÍ retira una preferencia ya declarada', async () => {
    const { service, update } = setup({
      foundUser: dbUser({ hearingLossLevel: HearingLossLevel.MILD }),
    });

    const user = await service.updateProfile(
      'user-id',
      UserRole.STUDENT,
      dto({ hearingLossLevel: null }),
    );

    expect(update.mock.calls[0]![0].data).toMatchObject({ hearingLossLevel: null });
    expect(user.hearingLossLevel).toBeNull();
  });

  it('nunca escribe email, role, status ni id, aunque lleguen en el DTO (AC6, AC7)', async () => {
    const { service, update } = setup();

    // Simula que alguien afloja el ValidationPipe y estos campos llegan al
    // service: el `data` se arma campo a campo, así que se quedan fuera igual.
    await service.updateProfile(
      'user-id',
      UserRole.STUDENT,
      dto({
        email: 'ladron@academia.local',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        id: 'id-de-otra-persona',
      } as Partial<UpdateProfileDto>),
    );

    const call = update.mock.calls[0]![0];
    expect(Object.keys(call.data)).toEqual(['firstName', 'lastName']);
    expect(call.data).not.toHaveProperty('email');
    expect(call.data).not.toHaveProperty('role');
    expect(call.data).not.toHaveProperty('status');
    // El `where` sigue apuntando al usuario del token, no al id del cuerpo.
    expect(call.where).toEqual({ id: 'user-id' });
  });

  it('el perfil editado es siempre el del id recibido, no el del cuerpo (AC6)', async () => {
    const { service, update } = setup();

    await service.updateProfile('usuario-autenticado', UserRole.STUDENT, dto());

    expect(update.mock.calls[0]![0].where).toEqual({ id: 'usuario-autenticado' });
  });

  it('la respuesta de la actualización tampoco lleva la contraseña', async () => {
    const { service } = setup();

    const user = await service.updateProfile('user-id', UserRole.STUDENT, dto());

    expect(user).not.toHaveProperty('password');
  });

  it('traduce el P2025 de Prisma a 404 USER_NOT_FOUND', async () => {
    const { service } = setup({ foundUser: null });

    await expect(service.updateProfile('user-id', UserRole.STUDENT, dto())).rejects.toMatchObject({
      response: { code: ApiErrorCode.USER_NOT_FOUND },
    });
  });

  it('relanza cualquier otro fallo de Prisma sin disfrazarlo de 404', async () => {
    const { service, update } = setup();
    update.mockRejectedValueOnce(Object.assign(new Error('conexión caída'), { code: 'P1001' }));

    await expect(service.updateProfile('user-id', UserRole.STUDENT, dto())).rejects.toThrow(
      'conexión caída',
    );
  });

  it.each([UserRole.TEACHER, UserRole.ADMIN])(
    'rechaza `hearingLossLevel` de un %s con ACCESSIBILITY_FIELDS_NOT_ALLOWED (AC3)',
    async (role) => {
      const { service, update } = setup();

      await expect(
        service.updateProfile('user-id', role, dto({ hearingLossLevel: HearingLossLevel.MILD })),
      ).rejects.toMatchObject({
        response: { code: ApiErrorCode.ACCESSIBILITY_FIELDS_NOT_ALLOWED },
      });
      expect(update).not.toHaveBeenCalled();
    },
  );

  it.each([UserRole.TEACHER, UserRole.ADMIN])(
    'rechaza `communicationPreference` de un %s con ACCESSIBILITY_FIELDS_NOT_ALLOWED (AC3)',
    async (role) => {
      const { service } = setup();

      await expect(
        service.updateProfile(
          'user-id',
          role,
          dto({ communicationPreference: CommunicationPreference.SIGN_LANGUAGE }),
        ),
      ).rejects.toMatchObject({
        response: { code: ApiErrorCode.ACCESSIBILITY_FIELDS_NOT_ALLOWED },
      });
    },
  );

  it.each([UserRole.TEACHER, UserRole.ADMIN])(
    'un %s sigue editando nombre y apellido sin tropezar con el rechazo (AC4)',
    async (role) => {
      const { service, update } = setup();

      const user = await service.updateProfile(
        'user-id',
        role,
        dto({ firstName: 'Nuevo', lastName: 'Apellido' }),
      );

      expect(update).toHaveBeenCalled();
      expect(user.firstName).toBe('Nuevo');
    },
  );
});
