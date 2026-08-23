import type { ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  ClassroomStatus,
  CommunicationPreference,
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
import type { ListClassroomsDto } from './dto/list-classrooms.dto';
import type { ListMisAulasDto } from './dto/list-mis-aulas.dto';
import type { UpdateClassroomAccessibilityDto } from './dto/update-classroom-accessibility.dto';
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
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
    meetingProvider: MeetingProvider.GOOGLE_MEET,
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
  it('crea el aula PUBLISHED, con 0 reservas y el profesor del token', async () => {
    const { service, create } = setup();

    const classroom = await service.createClassroom(profesorDelToken, entrada());

    expect(datosEscritos(create)).toMatchObject({
      teacherId: PROFESOR_ID,
      status: ClassroomStatus.PUBLISHED,
      currentBookings: 0,
    });
    expect(classroom.teacherId).toBe(PROFESOR_ID);
    expect(classroom.status).toBe(ClassroomStatus.PUBLISHED);
    expect(classroom.currentBookings).toBe(0);
  });

  // AC1, T3: los 5 campos de accesibilidad se escriben tal y como llegan del
  // DTO. `meetingProvider` ya no lo fija el servidor: lo elige el profesor.
  it('escribe los modos, los apoyos y la plataforma que declaró el profesor', async () => {
    const { service, create } = setup();

    const classroom = await service.createClassroom(
      profesorDelToken,
      entrada({
        communicationModes: [
          CommunicationPreference.SIGN_LANGUAGE,
          CommunicationPreference.LIP_READING,
        ],
        hasInterpreter: true,
        meetingProvider: MeetingProvider.ZOOM,
      }),
    );

    expect(datosEscritos(create)).toMatchObject({
      communicationModes: [
        CommunicationPreference.SIGN_LANGUAGE,
        CommunicationPreference.LIP_READING,
      ],
      hasInterpreter: true,
      hasLiveCaptions: false,
      hasVisualMaterials: false,
      meetingProvider: MeetingProvider.ZOOM,
    });
    expect(classroom.communicationModes).toEqual([
      CommunicationPreference.SIGN_LANGUAGE,
      CommunicationPreference.LIP_READING,
    ]);
  });

  // Los tres apoyos son opcionales (§4.9): omitirlos los deja en `false`, no
  // en `undefined` — la columna es `Boolean`, no admite un tercer estado.
  it('los apoyos omitidos se escriben en false, no en undefined', async () => {
    const { service, create } = setup();
    const {
      hasInterpreter: _h,
      hasLiveCaptions: _l,
      hasVisualMaterials: _v,
      ...sinApoyos
    } = entrada();

    await service.createClassroom(profesorDelToken, sinApoyos as CreateClassroomDto);

    expect(datosEscritos(create)).toMatchObject({
      hasInterpreter: false,
      hasLiveCaptions: false,
      hasVisualMaterials: false,
    });
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
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
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

    await service.listClassrooms(profesorDelToken, {});

    const and = whereDe(findMany);
    expect(and).toContainEqual({ status: ClassroomStatus.PUBLISHED });
    expect(and.some((c) => 'scheduledAt' in c && (c.scheduledAt as { gt: Date }).gt)).toBe(true);
    expect(count).toHaveBeenCalledWith({ where: { AND: and } });
  });

  // AC3: filtro de nivel, solo.
  it('filtra por nivel cuando se pide', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms(profesorDelToken, { level: EnglishLevel.ADVANCED });

    expect(whereDe(findMany)).toContainEqual({ level: EnglishLevel.ADVANCED });
  });

  // AC3: filtro de rango de fechas, solo.
  it('filtra por desde y hasta cuando se piden', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms(profesorDelToken, {
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

    await service.listClassrooms(profesorDelToken, {
      level: EnglishLevel.INTERMEDIATE,
      desde: '2099-01-01T00:00:00.000Z',
    });

    const and = whereDe(findMany);
    expect(and).toContainEqual({ level: EnglishLevel.INTERMEDIATE });
    expect(and).toContainEqual({ scheduledAt: { gte: new Date('2099-01-01T00:00:00.000Z') } });
  });

  // AC9: el filtro por modo de comunicación existe y se combina con los demás.
  it('filtra por modo de comunicación cuando se pide', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms(profesorDelToken, {
      communicationMode: CommunicationPreference.SIGN_LANGUAGE,
    });

    expect(whereDe(findMany)).toContainEqual({
      communicationModes: { has: CommunicationPreference.SIGN_LANGUAGE },
    });
  });

  it('combina el modo de comunicación con nivel y rango de fechas', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms(profesorDelToken, {
      level: EnglishLevel.INTERMEDIATE,
      desde: '2099-01-01T00:00:00.000Z',
      communicationMode: CommunicationPreference.LIP_READING,
    });

    const and = whereDe(findMany);
    expect(and).toContainEqual({ level: EnglishLevel.INTERMEDIATE });
    expect(and).toContainEqual({ scheduledAt: { gte: new Date('2099-01-01T00:00:00.000Z') } });
    expect(and).toContainEqual({
      communicationModes: { has: CommunicationPreference.LIP_READING },
    });
  });

  // Sin el filtro, no se le añade ninguna cláusula de por sí: AC5, no se
  // filtra por defecto.
  it('sin communicationMode no añade ninguna cláusula de modo', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms(profesorDelToken, {});

    expect(whereDe(findMany).some((clausula) => 'communicationModes' in clausula)).toBe(false);
  });

  // AC7: una aula sembrada antes de HU-211 —modos sin indicar— se sirve igual.
  it('un aula sin modos declarados se sirve con communicationModes: [], sin romper', async () => {
    const { service } = setupParaListado([filaDeAula({ communicationModes: [] })]);

    const [item] = (await service.listClassrooms(profesorDelToken, {})).items;

    expect(item).toMatchObject({ communicationModes: [] });
  });

  /**
   * HU-208, AC5–AC7. El filtro de presentación del profesor.
   *
   * Lo que estos tests protegen no es que filtre —eso es una línea— sino **de
   * dónde sale el id con el que filtra**: del token, y de ningún otro sitio.
   */
  describe('filtro `mias` (HU-208)', () => {
    it('con `mias`, acota al profesor del token', async () => {
      const { service, findMany } = setupParaListado();

      await service.listClassrooms(profesorDelToken, { mias: true });

      expect(whereDe(findMany)).toContainEqual({ teacherId: PROFESOR_ID });
    });

    // AC5, la mitad negativa: sin pedirlo, el catálogo sigue siendo el de todos.
    it('sin `mias`, no añade ninguna cláusula de profesor', async () => {
      const { service, findMany } = setupParaListado();

      await service.listClassrooms(profesorDelToken, {});

      expect(whereDe(findMany).some((clausula) => 'teacherId' in clausula)).toBe(false);
    });

    it('con `mias: false` explícito tampoco filtra', async () => {
      const { service, findMany } = setupParaListado();

      await service.listClassrooms(profesorDelToken, { mias: false });

      expect(whereDe(findMany).some((clausula) => 'teacherId' in clausula)).toBe(false);
    });

    /**
     * §4.8, regla 3, aplicada a este endpoint. El DTO no declara `teacherId`,
     * así que el `ValidationPipe` global lo tira antes de llegar aquí; este
     * test comprueba que, aunque se colara, el servicio usa el del token.
     */
    it('ignora un teacherId colado en el query: solo lee las aulas del token', async () => {
      const { service, findMany } = setupParaListado();
      const conIntruso = { mias: true, teacherId: OTRO_PROFESOR_ID } as ListClassroomsDto;

      await service.listClassrooms(profesorDelToken, conIntruso);

      const and = whereDe(findMany);
      expect(and).toContainEqual({ teacherId: PROFESOR_ID });
      expect(and).not.toContainEqual({ teacherId: OTRO_PROFESOR_ID });
    });

    /**
     * Un estudiante pidiendo `mias` no es un error: es una lista vacía. Su id
     * no es `teacherId` de ninguna aula, así que la consulta sale sola. No hace
     * falta un 403 —no hay nada que proteger: el filtro no puede revelar nada
     * que el catálogo no enseñe ya—.
     */
    it('un estudiante que pide `mias` filtra por su propio id, no por el de un profesor', async () => {
      const { service, findMany } = setupParaListado();
      const estudiante: AuthenticatedUser = {
        id: '99999999-9999-4999-8999-999999999999',
        email: 'ana@academia.local',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      };

      await service.listClassrooms(estudiante, { mias: true });

      expect(whereDe(findMany)).toContainEqual({ teacherId: estudiante.id });
    });

    // AC6/AC7: `count` recibe el MISMO `where`. Si no, «Página 1 de 3» contaría
    // aulas ajenas y el vacío del profesor aparecería con resultados detrás.
    it('el total se cuenta sobre el mismo where, no sobre el catálogo entero', async () => {
      const { service, findMany, count } = setupParaListado();

      await service.listClassrooms(profesorDelToken, { mias: true });

      expect(count).toHaveBeenCalledWith({ where: { AND: whereDe(findMany) } });
    });

    it('se combina con nivel y rango de fechas sin tapar a ninguno', async () => {
      const { service, findMany } = setupParaListado();

      await service.listClassrooms(profesorDelToken, {
        mias: true,
        level: EnglishLevel.BEGINNER,
        desde: '2099-01-01T00:00:00.000Z',
      });

      const and = whereDe(findMany);
      expect(and).toContainEqual({ teacherId: PROFESOR_ID });
      expect(and).toContainEqual({ level: EnglishLevel.BEGINNER });
      expect(and).toContainEqual({ scheduledAt: { gte: new Date('2099-01-01T00:00:00.000Z') } });
    });

    // El filtro NO relaja el catálogo: sigue siendo publicadas y futuras. Un
    // profesor no ve aquí sus canceladas ni sus pasadas — para eso está
    // `/classrooms/mias`, que es otra vista (§4.8).
    it('no relaja el catálogo: sigue siendo solo PUBLISHED y futuras', async () => {
      const { service, findMany } = setupParaListado();

      await service.listClassrooms(profesorDelToken, { mias: true });

      const and = whereDe(findMany);
      expect(and).toContainEqual({ status: ClassroomStatus.PUBLISHED });
      expect(and.some((c) => 'scheduledAt' in c && (c.scheduledAt as { gt: Date }).gt)).toBe(true);
    });
  });

  // AC3: orden ascendente por scheduledAt.
  it('ordena por scheduledAt ascendente', async () => {
    const { service, findMany } = setupParaListado();

    await service.listClassrooms(profesorDelToken, {});

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({ orderBy: { scheduledAt: 'asc' } });
  });

  describe('paginación (A4)', () => {
    it('usa página 1 y el tamaño por defecto cuando no se piden', async () => {
      const { service, findMany } = setupParaListado();

      const resultado = await service.listClassrooms(profesorDelToken, {});

      expect(findMany.mock.calls[0]?.[0]).toMatchObject({ skip: 0, take: 20 });
      expect(resultado.page).toBe(1);
      expect(resultado.pageSize).toBe(20);
    });

    it('calcula el skip a partir de la página pedida', async () => {
      const { service, findMany } = setupParaListado();

      const resultado = await service.listClassrooms(profesorDelToken, { page: 3, pageSize: 10 });

      expect(findMany.mock.calls[0]?.[0]).toMatchObject({ skip: 20, take: 10 });
      expect(resultado.page).toBe(3);
      expect(resultado.pageSize).toBe(10);
    });

    it('devuelve el total real de la consulta, no el largo de la página', async () => {
      const { service } = setupParaListado([filaDeAula(), filaDeAula({ id: 'otra-aula' })], 47);

      const resultado = await service.listClassrooms(profesorDelToken, { pageSize: 2 });

      expect(resultado.total).toBe(47);
      expect(resultado.items).toHaveLength(2);
    });
  });

  // AC2, con el mecanismo real de por qué es imposible: toClassroomListItem
  // pasa por toPublicClassroom, que nunca copia el campo.
  it('ningún item de la respuesta trae meetingLink', async () => {
    const { service } = setupParaListado();

    const resultado = await service.listClassrooms(profesorDelToken, {});

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

    const [item] = (await service.listClassrooms(profesorDelToken, {})).items;

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

/* ------------------------------------------------------------------------- *
 * Detalle — GET /classrooms/:id (HU-204)
 * ------------------------------------------------------------------------- */

const ESTUDIANTE_ID = '55555555-5555-4555-8555-555555555555';
const ADMIN_ID = '66666666-6666-4666-8666-666666666666';

const otroProfesor: AuthenticatedUser = {
  id: OTRO_PROFESOR_ID,
  email: 'otro@academia.local',
  role: UserRole.TEACHER,
  status: UserStatus.ACTIVE,
};

const estudiante: AuthenticatedUser = {
  id: ESTUDIANTE_ID,
  email: 'ana@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

const administradora: AuthenticatedUser = {
  id: ADMIN_ID,
  email: 'admin@academia.local',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
};

/**
 * Monta el servicio para el detalle, con el enlace **cifrado de verdad**.
 *
 * Se usa el cipher real y no un doble a propósito: lo que estos tests afirman
 * es que quien no debe verlo no recibe *ni la URL ni el texto cifrado*, y con
 * un valor falso en la columna la mitad de esa comprobación sería vacía.
 *
 * `aula: null` simula un `id` que no existe.
 */
function setupDetalle(aula: Record<string, unknown> | null = {}) {
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);
  const cifrado = cipher.encrypt(ENLACE);

  const findUnique = vi
    .fn()
    .mockResolvedValue(aula === null ? null : filaDeAula({ meetingLink: cifrado, ...aula }));
  const prisma = { classroom: { findUnique } } as unknown as PrismaService;

  return { service: new ClassroomsService(prisma, cipher), findUnique, cifrado };
}

const ID_DEL_AULA = '44444444-4444-4444-8444-444444444444';

describe('ClassroomsService.getClassroomDetail — el aula completa (A1, AC1)', () => {
  it('devuelve el aula con su profesor, su descripción y sus datos de horario', async () => {
    const { service } = setupDetalle({ teacher: { firstName: 'Ana', lastName: 'Restrepo' } });

    const classroom = await service.getClassroomDetail(profesorDelToken, ID_DEL_AULA);

    expect(classroom).toMatchObject({
      id: ID_DEL_AULA,
      title: 'Conversación cotidiana',
      description: 'Practicamos saludos y presentaciones.',
      level: EnglishLevel.BEGINNER,
      maxStudents: 8,
      currentBookings: 2,
      durationMinutes: 60,
      teacherFirstName: 'Ana',
      teacherLastName: 'Restrepo',
    });
    // §4.7: el instante viaja en UTC, con la `Z` explícita.
    expect(classroom.scheduledAt).toBe('2099-08-12T23:00:00.000Z');
  });

  it('busca exactamente por el id pedido, con el nombre del profesor', async () => {
    const { service, findUnique } = setupDetalle();

    await service.getClassroomDetail(estudiante, ID_DEL_AULA);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: ID_DEL_AULA },
      include: { teacher: { select: { firstName: true, lastName: true } } },
    });
  });

  /**
   * Decisión de auditoría 2 de la HU: el campo existe en el contrato y llega
   * vacío. `null` y no ausente — «no tienes reserva» es un hecho, no un «no te
   * corresponde saberlo».
   */
  it('myBookingStatus llega en null: Booking no existe hasta el Sprint 3', async () => {
    const { service } = setupDetalle();

    const classroom = await service.getClassroomDetail(estudiante, ID_DEL_AULA);

    expect(classroom.myBookingStatus).toBeNull();
  });
});

describe('ClassroomsService.getClassroomDetail — quién ve el enlace (A2, AC2)', () => {
  it('el profesor dueño lo recibe descifrado', async () => {
    const { service } = setupDetalle();

    const classroom = await service.getClassroomDetail(profesorDelToken, ID_DEL_AULA);

    expect(classroom.meetingLink).toBe(ENLACE);
  });

  /**
   * La garantía central de la HU, rol por rol. **Ni la clave en `null`, ni el
   * texto cifrado, ni la URL en ninguna parte del JSON**: §4.1 pide que el campo
   * no viaje, no que viaje vacío.
   *
   * El administrador está en la lista a propósito: §4.8 regla 2 dice que la
   * regla no tiene excepción por rol, «y menos para el rol con más poder».
   */
  it.each([
    ['otro profesor', () => otroProfesor],
    ['un estudiante', () => estudiante],
    ['un administrador', () => administradora],
  ])('%s recibe una respuesta SIN la clave meetingLink', async (_quien, usuario) => {
    const { service, cifrado } = setupDetalle();

    const classroom = await service.getClassroomDetail(usuario(), ID_DEL_AULA);

    expect(classroom).not.toHaveProperty('meetingLink');
    expect(Object.keys(classroom)).not.toContain('meetingLink');
    expect(JSON.stringify(classroom)).not.toContain(ENLACE);
    expect(JSON.stringify(classroom)).not.toContain(cifrado);
  });
});

describe('ClassroomsService.getClassroomDetail — aula cancelada e id inexistente (A3, AC3, AC4)', () => {
  /**
   * AC4. La cancelada **se abre**: no aparece en el catálogo, pero quien tenga
   * el enlace de la página tiene que poder entender qué pasó (decisión de
   * auditoría 3). Un 404 aquí se lee como un fallo de la plataforma.
   */
  it('un aula CANCELLED se devuelve con su estado, no con un 404', async () => {
    const { service } = setupDetalle({ status: ClassroomStatus.CANCELLED });

    const classroom = await service.getClassroomDetail(estudiante, ID_DEL_AULA);

    expect(classroom.status).toBe(ClassroomStatus.CANCELLED);
    expect(classroom.id).toBe(ID_DEL_AULA);
  });

  // «Sin enlace de reunión, en ningún caso»: esa reunión no va a ocurrir.
  it('un aula CANCELLED no revela el enlace NI a su dueño', async () => {
    const { service, cifrado } = setupDetalle({ status: ClassroomStatus.CANCELLED });

    const classroom = await service.getClassroomDetail(profesorDelToken, ID_DEL_AULA);

    expect(classroom).not.toHaveProperty('meetingLink');
    expect(JSON.stringify(classroom)).not.toContain(cifrado);
  });

  it('un id que no existe responde CLASSROOM_NOT_FOUND', async () => {
    const { service } = setupDetalle(null);

    expect(await codigoDe(service.getClassroomDetail(estudiante, ID_DEL_AULA))).toBe(
      ApiErrorCode.CLASSROOM_NOT_FOUND,
    );
  });
});

/* ------------------------------------------------------------------------- *
 * PATCH /classrooms/:id — completar accesibilidad (HU-211, T4)
 * ------------------------------------------------------------------------- */

function entradaAccesibilidad(
  overrides: Partial<UpdateClassroomAccessibilityDto> = {},
): UpdateClassroomAccessibilityDto {
  return {
    communicationModes: [CommunicationPreference.SIGN_LANGUAGE],
    ...overrides,
  };
}

/** Monta el servicio solo con lo que necesita `updateClassroomAccessibility`. */
function setupActualizarAccesibilidad(aula: Record<string, unknown> | null) {
  const findUnique = vi.fn().mockResolvedValue(aula === null ? null : filaDeAula(aula));
  const update = vi
    .fn()
    .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(filaDeAula({ ...aula, ...data })),
    );
  const prisma = { classroom: { findUnique, update } } as unknown as PrismaService;
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);

  return { service: new ClassroomsService(prisma, cipher), findUnique, update };
}

describe('ClassroomsService.updateClassroomAccessibility', () => {
  it('el dueño completa los modos de un aula «sin indicar»', async () => {
    const { service, update } = setupActualizarAccesibilidad({
      teacherId: PROFESOR_ID,
      communicationModes: [],
    });

    const classroom = await service.updateClassroomAccessibility(
      profesorDelToken,
      ID_DEL_AULA,
      entradaAccesibilidad({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] }),
    );

    expect(update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: ID_DEL_AULA },
      data: { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
    });
    expect(classroom.communicationModes).toEqual([CommunicationPreference.SIGN_LANGUAGE]);
  });

  it('omitir un apoyo o la plataforma los deja como estaban', async () => {
    const { service, update } = setupActualizarAccesibilidad({ teacherId: PROFESOR_ID });

    await service.updateClassroomAccessibility(
      profesorDelToken,
      ID_DEL_AULA,
      entradaAccesibilidad({ hasInterpreter: true }),
    );

    const data = update.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(data).toHaveProperty('hasInterpreter', true);
    expect(data).not.toHaveProperty('hasLiveCaptions');
    expect(data).not.toHaveProperty('hasVisualMaterials');
    expect(data).not.toHaveProperty('meetingProvider');
  });

  // La garantía de propiedad de la HU: solo el dueño completa su aula.
  it('otro profesor recibe CLASSROOM_FORBIDDEN, y no se escribe nada', async () => {
    const { service, update } = setupActualizarAccesibilidad({ teacherId: PROFESOR_ID });

    expect(
      await codigoDe(
        service.updateClassroomAccessibility(otroProfesor, ID_DEL_AULA, entradaAccesibilidad()),
      ),
    ).toBe(ApiErrorCode.CLASSROOM_FORBIDDEN);
    expect(update).not.toHaveBeenCalled();
  });

  it('un id que no existe responde CLASSROOM_NOT_FOUND', async () => {
    const { service, update } = setupActualizarAccesibilidad(null);

    expect(
      await codigoDe(
        service.updateClassroomAccessibility(profesorDelToken, ID_DEL_AULA, entradaAccesibilidad()),
      ),
    ).toBe(ApiErrorCode.CLASSROOM_NOT_FOUND);
    expect(update).not.toHaveBeenCalled();
  });
});
