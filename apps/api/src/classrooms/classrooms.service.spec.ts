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

/** Fila cruda tal y como la devolvería Prisma, con el `include` del profesor. */
function filaDeAula(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    teacherId: PROFESOR_ID,
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 2,
    scheduledAt: new Date('2099-08-12T23:00:00.000Z'),
    durationMinutes: 60,
    meetingLink: 'v1.iv.tag.texto',
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
    teacher: { firstName: 'Paula', lastName: 'Profesora' },
    ...overrides,
  };
}

/** Monta el servicio con un Prisma falso, solo para `listClassrooms`. */
function setupParaListado(
  filas: ReturnType<typeof filaDeAula>[] = [filaDeAula()],
  total = filas.length,
) {
  const findMany = vi.fn().mockResolvedValue(filas);
  const count = vi.fn().mockResolvedValue(total);
  const prisma = { classroom: { findMany, count } } as unknown as PrismaService;
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);

  return { service: new ClassroomsService(prisma, cipher), findMany, count };
}

/** El `where` con el que se llamó a `findMany` (idéntico al de `count`). */
function whereDe(findMany: ReturnType<typeof setupParaListado>['findMany']) {
  return (findMany.mock.calls[0]?.[0] as { where: { AND: Record<string, unknown>[] } }).where.AND;
}

describe('ClassroomsService.listClassrooms', () => {
  // AC1: solo PUBLISHED con scheduledAt futuro.
  it('excluye siempre CANCELLED y lo ya pasado, publicadas y futuras', async () => {
    const { service, findMany, count } = setupParaListado();

    await service.listClassrooms({});

    const and = whereDe(findMany);
    expect(and).toContainEqual({ status: ClassroomStatus.PUBLISHED });
    expect(and.some((c) => 'scheduledAt' in c && (c.scheduledAt as { gt: Date }).gt)).toBe(true);
    expect(count).toHaveBeenCalledWith({ where: { AND: and } });
  });

  // AC3: filtro de nivel, solo.
  it('filtra por nivel cuando se pide', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms({ level: EnglishLevel.ADVANCED });

    expect(whereDe(findMany)).toContainEqual({ level: EnglishLevel.ADVANCED });
  });

  // AC3: filtro de rango de fechas, solo.
  it('filtra por desde y hasta cuando se piden', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms({
      desde: '2099-01-01T00:00:00.000Z',
      hasta: '2099-12-31T23:59:59.000Z',
    });

    const and = whereDe(findMany);
    expect(and).toContainEqual({ scheduledAt: { gte: new Date('2099-01-01T00:00:00.000Z') } });
    expect(and).toContainEqual({ scheduledAt: { lte: new Date('2099-12-31T23:59:59.000Z') } });
  });

  // AC3: nivel y rango combinados, sin que uno tape al otro.
  it('combina nivel y rango de fechas en la misma consulta', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms({
      level: EnglishLevel.INTERMEDIATE,
      desde: '2099-01-01T00:00:00.000Z',
    });

    const and = whereDe(findMany);
    expect(and).toContainEqual({ level: EnglishLevel.INTERMEDIATE });
    expect(and).toContainEqual({ scheduledAt: { gte: new Date('2099-01-01T00:00:00.000Z') } });
  });

  // AC3: orden ascendente por scheduledAt.
  it('ordena por scheduledAt ascendente', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms({});

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({ orderBy: { scheduledAt: 'asc' } });
  });

  describe('paginación (A4)', () => {
    it('usa página 1 y el tamaño por defecto cuando no se piden', async () => {
      const { service, findMany } = setupParaListado();

      const resultado = await service.listClassrooms({});

      expect(findMany.mock.calls[0]?.[0]).toMatchObject({ skip: 0, take: 20 });
      expect(resultado.page).toBe(1);
      expect(resultado.pageSize).toBe(20);
    });

    it('calcula el skip a partir de la página pedida', async () => {
      const { service, findMany } = setupParaListado();

      const resultado = await service.listClassrooms({ page: 3, pageSize: 10 });

      expect(findMany.mock.calls[0]?.[0]).toMatchObject({ skip: 20, take: 10 });
      expect(resultado.page).toBe(3);
      expect(resultado.pageSize).toBe(10);
    });

    it('devuelve el total real de la consulta, no el largo de la página', async () => {
      const { service } = setupParaListado([filaDeAula(), filaDeAula({ id: 'otra-aula' })], 47);

      const resultado = await service.listClassrooms({ pageSize: 2 });

      expect(resultado.total).toBe(47);
      expect(resultado.items).toHaveLength(2);
    });
  });

  // AC2, con el mecanismo real de por qué es imposible: toClassroomListItem
  // pasa por toPublicClassroom, que nunca copia el campo.
  it('ningún item de la respuesta trae meetingLink', async () => {
    const { service } = setupParaListado();

    const resultado = await service.listClassrooms({});

    for (const item of resultado.items) {
      expect(item).not.toHaveProperty('meetingLink');
    }
    expect(JSON.stringify(resultado)).not.toContain('v1.iv.tag.texto');
  });

  // A3: el nombre del profesor viaja plano, sin objeto anidado ni el resto de su perfil.
  it('incluye el nombre del profesor de cada aula', async () => {
    const { service } = setupParaListado([
      filaDeAula({ teacher: { firstName: 'Ana', lastName: 'Restrepo' } }),
    ]);

    const [item] = (await service.listClassrooms({})).items;

    expect(item).toMatchObject({ teacherFirstName: 'Ana', teacherLastName: 'Restrepo' });
  });
});
