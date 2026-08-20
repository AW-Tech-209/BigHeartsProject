import type { ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  ClassroomStatus,
  EnglishLevel,
  MeetingProvider,
  UserRole,
  UserStatus,
} from '@academia/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../prisma/prisma.service';
import { ClassroomsService } from './classrooms.service';
import type { CreateClassroomDto } from './dto/create-classroom.dto';
import { MeetingLinkCipher } from './meeting-link.cipher';

const PROFESOR_ID = '11111111-1111-4111-8111-111111111111';
const OTRO_PROFESOR_ID = '22222222-2222-4222-8222-222222222222';
const ENLACE = 'https://meet.google.com/abc-defg-hij';

/** El profesor tal y como llega en el token. */
const profesorDelToken: AuthenticatedUser = {
  id: PROFESOR_ID,
  email: 'paula@academia.local',
  role: UserRole.TEACHER,
  status: UserStatus.ACTIVE,
};

function entrada(overrides: Partial<CreateClassroomDto> = {}): CreateClassroomDto {
  return {
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    scheduledAt: '2027-08-12T23:00:00.000Z',
    durationMinutes: 60,
    meetingLink: ENLACE,
    ...overrides,
  };
}

/**
 * Monta el servicio con un Prisma falso.
 *
 * `create` devuelve lo que se le pasó, más los campos que pone la BD: así el
 * test comprueba lo que el servicio DECIDIÓ escribir, que es lo que las
 * garantías de la HU están afirmando.
 */
function setup(options: { teacherEnBd?: { role: UserRole; status: UserStatus } | null } = {}) {
  const findUnique = vi
    .fn()
    .mockResolvedValue(
      'teacherEnBd' in options
        ? options.teacherEnBd
        : { role: UserRole.TEACHER, status: UserStatus.ACTIVE },
    );

  const create = vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      id: '33333333-3333-4333-8333-333333333333',
      isRecurring: false,
      createdAt: new Date('2026-08-20T10:00:00.000Z'),
      updatedAt: new Date('2026-08-20T10:00:00.000Z'),
      ...data,
    }),
  );

  const prisma = { user: { findUnique }, classroom: { create } } as unknown as PrismaService;
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);

  return { service: new ClassroomsService(prisma, cipher), create, findUnique, cipher };
}

/** Extrae el `code` del cuerpo de la excepción: es lo que ve el frontend. */
async function codigoDe(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const body = (error as ForbiddenException).getResponse() as { code: string };
    return body.code;
  }
  throw new Error('Se esperaba una excepción y no hubo ninguna.');
}

/** Los datos con los que el servicio llamó a `classroom.create`. */
function datosEscritos(create: ReturnType<typeof setup>['create']): Record<string, unknown> {
  return (create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
}

beforeEach(() => vi.clearAllMocks());

describe('ClassroomsService.createClassroom', () => {
  // AC1: el aula nace publicada, sin reservas y a nombre de quien la pidió.
  it('crea el aula PUBLISHED, con 0 reservas, proveedor MANUAL y el profesor del token', async () => {
    const { service, create } = setup();

    const classroom = await service.createClassroom(profesorDelToken, entrada());

    expect(datosEscritos(create)).toMatchObject({
      teacherId: PROFESOR_ID,
      status: ClassroomStatus.PUBLISHED,
      currentBookings: 0,
      meetingProvider: MeetingProvider.MANUAL,
    });
    expect(classroom.teacherId).toBe(PROFESOR_ID);
    expect(classroom.status).toBe(ClassroomStatus.PUBLISHED);
    expect(classroom.currentBookings).toBe(0);
  });

  /**
   * AC3. El DTO ni siquiera declara `teacherId` —el `ValidationPipe` global
   * rechaza el campo antes de llegar aquí—, pero el servicio recibe el objeto
   * de entrada entero, así que esto prueba la segunda mitad de la garantía: aun
   * con el campo dentro, el dueño sale del token.
   */
  it('ignora un teacherId colado en la entrada: el dueño siempre es el del token', async () => {
    const { service, create } = setup();
    const conIntruso = { ...entrada(), teacherId: OTRO_PROFESOR_ID } as CreateClassroomDto;

    const classroom = await service.createClassroom(profesorDelToken, conIntruso);

    expect(datosEscritos(create).teacherId).toBe(PROFESOR_ID);
    expect(classroom.teacherId).toBe(PROFESOR_ID);
  });

  /**
   * AC2, en el punto donde se decide: lo que va a la columna es texto cifrado.
   * Si alguien quitara el `encrypt` de aquí, este test se pone rojo antes de
   * que ningún enlace llegue a la base de datos de nadie.
   */
  it('escribe el enlace CIFRADO en la columna, nunca la URL en claro', async () => {
    const { service, create, cipher } = setup();

    await service.createClassroom(profesorDelToken, entrada());
    const guardado = datosEscritos(create).meetingLink as string;

    expect(guardado).not.toContain(ENLACE);
    expect(guardado).not.toContain('meet.google.com');
    expect(guardado).toMatch(/^v1\./);
    // Y sigue siendo el mismo enlace cuando quien corresponda lo descifre.
    expect(cipher.decrypt(guardado)).toBe(ENLACE);
  });

  // AC2 (segunda mitad): tampoco sale por la respuesta. El profesor ya lo tiene
  // —lo acaba de escribir—; revelarlo es competencia de HU-204/HU-303.
  it('no devuelve el enlace en la respuesta, ni cifrado ni en claro', async () => {
    const { service } = setup();

    const classroom = await service.createClassroom(profesorDelToken, entrada());

    expect(classroom).not.toHaveProperty('meetingLink');
    expect(JSON.stringify(classroom)).not.toContain('meet.google.com');
  });

  // AC6: la cadena que viaja es UTC, venga en la zona que venga.
  it('persiste scheduledAt como instante UTC aunque llegue con otro desfase', async () => {
    const { service, create } = setup();

    const classroom = await service.createClassroom(
      profesorDelToken,
      // 18:00 en Colombia (UTC−5) es 23:00 UTC.
      entrada({ scheduledAt: '2027-08-12T18:00:00.000-05:00' }),
    );

    expect(datosEscritos(create).scheduledAt).toEqual(new Date('2027-08-12T23:00:00.000Z'));
    expect(classroom.scheduledAt).toBe('2027-08-12T23:00:00.000Z');
  });

  describe('autorización por estado de la cuenta (AC5)', () => {
    /**
     * El estado se lee de la BD, no del token. Estos tres casos son
     * inalcanzables mirando solo el token —dice `ACTIVE` en los tres—, y son
     * exactamente la ventana de 15 minutos que el access token deja abierta
     * cuando un administrador suspende o rechaza a alguien.
     */
    it.each([
      [UserStatus.PENDING, ApiErrorCode.ACCOUNT_PENDING],
      [UserStatus.REJECTED, ApiErrorCode.ACCOUNT_REJECTED],
      [UserStatus.SUSPENDED, ApiErrorCode.ACCOUNT_SUSPENDED],
    ])('un profesor %s no crea aulas: responde %s', async (status, code) => {
      const { service, create } = setup({ teacherEnBd: { role: UserRole.TEACHER, status } });

      expect(await codigoDe(service.createClassroom(profesorDelToken, entrada()))).toBe(code);
      expect(create).not.toHaveBeenCalled();
    });

    it('un usuario que ya no es TEACHER en la BD recibe INSUFFICIENT_ROLE', async () => {
      const { service, create } = setup({
        teacherEnBd: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
      });

      expect(await codigoDe(service.createClassroom(profesorDelToken, entrada()))).toBe(
        ApiErrorCode.INSUFFICIENT_ROLE,
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('un token válido cuya cuenta ya no existe recibe USER_NOT_FOUND', async () => {
      const { service, create } = setup({ teacherEnBd: null });

      expect(await codigoDe(service.createClassroom(profesorDelToken, entrada()))).toBe(
        ApiErrorCode.USER_NOT_FOUND,
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('comprueba el estado ANTES de escribir nada', async () => {
      const { service, findUnique } = setup();

      await service.createClassroom(profesorDelToken, entrada());

      expect(findUnique).toHaveBeenCalledWith({
        where: { id: PROFESOR_ID },
        select: { role: true, status: true },
      });
    });
  });
});
