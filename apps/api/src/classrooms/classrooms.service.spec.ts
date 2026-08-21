import type { ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  ClassroomStatus,
  EnglishLevel,
  EstadoTemporalAula,
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
import type { ListMisAulasDto } from './dto/list-mis-aulas.dto';
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

/* ------------------------------------------------------------------------- *
 * «Mis aulas» — GET /classrooms/mias (HU-207)
 * ------------------------------------------------------------------------- */

type FilaMia = ReturnType<typeof filaMia>;

/** Fila cruda de un aula propia. Sin `include` del profesor: es quien pregunta. */
function filaMia(id: string, scheduledAt: string, overrides: Record<string, unknown> = {}) {
  const { teacher: _teacher, ...sinProfesor } = filaDeAula();
  return { ...sinProfesor, id, scheduledAt: new Date(scheduledAt), ...overrides };
}

function cancelada(id: string, scheduledAt: string) {
  return filaMia(id, scheduledAt, { status: ClassroomStatus.CANCELLED });
}

/**
 * Prisma falso que **entiende las tres cláusulas** de `listMisAulas` y responde
 * lo que le tocaría a cada una, ordenando y paginando de verdad.
 *
 * Es más fake de lo habitual a propósito: el filtro `todas` no es una consulta
 * sino dos listas concatenadas, y lo que hay que probar —que la página no
 * duplica ni pierde filas al saltar de un bloque al otro— solo se ve si el
 * doble respeta `orderBy`, `skip` y `take`.
 */
function setupMisAulas(
  grupos: { proximas?: FilaMia[]; pasadas?: FilaMia[]; canceladas?: FilaMia[] } = {},
) {
  const proximas = grupos.proximas ?? [];
  const pasadas = grupos.pasadas ?? [];
  const canceladas = grupos.canceladas ?? [];

  type Where = {
    teacherId?: string;
    status?: unknown;
    scheduledAt?: { gt?: Date; lte?: Date };
    OR?: unknown[];
  };

  function filasDe(where: Where): FilaMia[] {
    // El `OR` solo lo usa el historial del filtro `todas`.
    if (where.OR) return [...canceladas, ...pasadas];
    if (where.status === ClassroomStatus.CANCELLED) return canceladas;
    return where.scheduledAt?.gt ? proximas : pasadas;
  }

  const findMany = vi.fn(
    ({
      where,
      orderBy,
      skip = 0,
      take,
    }: {
      where: Where;
      orderBy: { scheduledAt: 'asc' | 'desc' };
      skip?: number;
      take: number;
    }) => {
      const ordenadas = [...filasDe(where)].sort((a, b) => {
        const diferencia = a.scheduledAt.getTime() - b.scheduledAt.getTime();
        return orderBy.scheduledAt === 'asc' ? diferencia : -diferencia;
      });
      return Promise.resolve(ordenadas.slice(skip, skip + take));
    },
  );

  const count = vi.fn(({ where }: { where: Where }) => Promise.resolve(filasDe(where).length));

  const prisma = { classroom: { findMany, count } } as unknown as PrismaService;
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);

  return { service: new ClassroomsService(prisma, cipher), findMany, count };
}

/** Los `where` de todas las consultas que se lanzaron, `findMany` y `count`. */
function wheresDe(...espias: ReturnType<typeof vi.fn>[]): Record<string, unknown>[] {
  return espias.flatMap((espia) =>
    espia.mock.calls.map((llamada) => (llamada[0] as { where: Record<string, unknown> }).where),
  );
}

const AYER = '2020-08-11T23:00:00.000Z';
const ANTEAYER = '2020-08-10T23:00:00.000Z';
const PRONTO = '2099-08-12T23:00:00.000Z';
const MAS_TARDE = '2099-09-12T23:00:00.000Z';

describe('ClassroomsService.listMisAulas — alcance (A1, AC3)', () => {
  it('acota SIEMPRE al profesor del token, en todas las consultas', async () => {
    const { service, findMany, count } = setupMisAulas({ proximas: [filaMia('a', PRONTO)] });

    await service.listMisAulas(profesorDelToken, {});

    const wheres = wheresDe(findMany, count);
    expect(wheres.length).toBeGreaterThan(0);
    for (const where of wheres) {
      expect(where.teacherId).toBe(PROFESOR_ID);
    }
  });

  /**
   * AC3, en la segunda mitad de la garantía. El DTO no declara `teacherId` y el
   * `whitelist` del ValidationPipe lo rechaza antes de llegar aquí, pero el
   * servicio recibe el objeto entero: aun con el campo dentro, el alcance sigue
   * saliendo del token.
   */
  it('ignora un teacherId colado en el query: nunca lee las aulas de otro', async () => {
    const { service, findMany, count } = setupMisAulas({ proximas: [filaMia('a', PRONTO)] });
    const conIntruso = { teacherId: OTRO_PROFESOR_ID } as ListMisAulasDto;

    await service.listMisAulas(profesorDelToken, conIntruso);

    for (const where of wheresDe(findMany, count)) {
      expect(where.teacherId).toBe(PROFESOR_ID);
      expect(where.teacherId).not.toBe(OTRO_PROFESOR_ID);
    }
  });
});

describe('ClassroomsService.listMisAulas — filtro temporal (A2, A3, AC6, AC7)', () => {
  // A2: el registro completo. Ni las canceladas ni las pasadas se esconden.
  it('sin filtro devuelve todas: próximas, pasadas y canceladas', async () => {
    const { service } = setupMisAulas({
      proximas: [filaMia('proxima', PRONTO)],
      pasadas: [filaMia('pasada', AYER)],
      canceladas: [cancelada('cancelada', ANTEAYER)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, {});

    expect(resultado.total).toBe(3);
    expect(resultado.items.map((item) => item.id)).toEqual(['proxima', 'pasada', 'cancelada']);
  });

  // AC7: próximas ascendente —la más cercana primero—, historial descendente.
  it('ordena las próximas ascendente y el historial descendente', async () => {
    const { service } = setupMisAulas({
      proximas: [filaMia('lejana', MAS_TARDE), filaMia('cercana', PRONTO)],
      pasadas: [filaMia('anteayer', ANTEAYER), filaMia('ayer', AYER)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, {});

    expect(resultado.items.map((item) => item.id)).toEqual([
      'cercana',
      'lejana',
      'ayer',
      'anteayer',
    ]);
  });

  it('el filtro proximas deja fuera las pasadas y las canceladas', async () => {
    const { service } = setupMisAulas({
      proximas: [filaMia('proxima', PRONTO)],
      pasadas: [filaMia('pasada', AYER)],
      canceladas: [cancelada('cancelada', MAS_TARDE)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, {
      estado: EstadoTemporalAula.PROXIMAS,
    });

    expect(resultado.items.map((item) => item.id)).toEqual(['proxima']);
    expect(resultado.total).toBe(1);
  });

  it('el filtro pasadas devuelve solo lo ya impartido, lo más reciente primero', async () => {
    const { service } = setupMisAulas({
      proximas: [filaMia('proxima', PRONTO)],
      pasadas: [filaMia('anteayer', ANTEAYER), filaMia('ayer', AYER)],
      canceladas: [cancelada('cancelada', ANTEAYER)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, {
      estado: EstadoTemporalAula.PASADAS,
    });

    expect(resultado.items.map((item) => item.id)).toEqual(['ayer', 'anteayer']);
  });

  /**
   * Una cancelada del mes que viene sale en `canceladas` y **no** en
   * `proximas`: los tres grupos son disjuntos, y estar en dos haría que `todas`
   * la contara dos veces.
   */
  it('el filtro canceladas incluye las de fecha futura, y solo esas', async () => {
    const { service } = setupMisAulas({
      proximas: [filaMia('proxima', PRONTO)],
      canceladas: [cancelada('cancelada-futura', MAS_TARDE), cancelada('cancelada-vieja', AYER)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, {
      estado: EstadoTemporalAula.CANCELADAS,
    });

    expect(resultado.items.map((item) => item.id)).toEqual(['cancelada-futura', 'cancelada-vieja']);
  });
});

describe('ClassroomsService.listMisAulas — paginación (A5)', () => {
  it('usa página 1 y el tamaño por defecto, y devuelve el formato del catálogo', async () => {
    const { service } = setupMisAulas({ proximas: [filaMia('a', PRONTO)] });

    const resultado = await service.listMisAulas(profesorDelToken, {});

    expect(resultado).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    expect(Object.keys(resultado).sort()).toEqual(['items', 'page', 'pageSize', 'total']);
  });

  /**
   * El caso que justifica las dos consultas: una página que **empieza en las
   * próximas y termina en el historial**. Ninguna fila puede salir dos veces ni
   * caerse entre las dos páginas.
   */
  it('una página a caballo entre los dos bloques no duplica ni pierde filas', async () => {
    const grupos = {
      proximas: [filaMia('cercana', PRONTO), filaMia('lejana', MAS_TARDE)],
      pasadas: [filaMia('ayer', AYER), filaMia('anteayer', ANTEAYER)],
    };

    const primera = await setupMisAulas(grupos).service.listMisAulas(profesorDelToken, {
      pageSize: 3,
    });
    const segunda = await setupMisAulas(grupos).service.listMisAulas(profesorDelToken, {
      page: 2,
      pageSize: 3,
    });

    expect(primera.items.map((item) => item.id)).toEqual(['cercana', 'lejana', 'ayer']);
    expect(segunda.items.map((item) => item.id)).toEqual(['anteayer']);
    expect(primera.total).toBe(4);
    expect(segunda.total).toBe(4);
  });

  it('una página que cae entera en el historial no vuelve a pedir las próximas', async () => {
    const { service, findMany } = setupMisAulas({
      proximas: [filaMia('cercana', PRONTO)],
      pasadas: [filaMia('ayer', AYER), filaMia('anteayer', ANTEAYER)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, { page: 2, pageSize: 2 });

    expect(resultado.items.map((item) => item.id)).toEqual(['anteayer']);
    expect(findMany).toHaveBeenCalledTimes(1);
  });
});

// AC5 — la garantía más importante de esta HU: el enlace no viaja NI AL DUEÑO.
// El mecanismo es `toPublicClassroom`, que nunca copia el campo; este test es
// el que se pone rojo si alguien decide que "total, es su propia aula".
describe('ClassroomsService.listMisAulas — el enlace nunca viaja (A4, AC5)', () => {
  it('ningún aula propia trae meetingLink, ni cifrado ni en claro', async () => {
    const { service } = setupMisAulas({
      proximas: [filaMia('proxima', PRONTO)],
      pasadas: [filaMia('pasada', AYER)],
      canceladas: [cancelada('cancelada', ANTEAYER)],
    });

    const resultado = await service.listMisAulas(profesorDelToken, {});

    expect(resultado.items).toHaveLength(3);
    for (const item of resultado.items) {
      expect(item).not.toHaveProperty('meetingLink');
    }
    expect(JSON.stringify(resultado)).not.toContain('v1.iv.tag.texto');
  });
});
