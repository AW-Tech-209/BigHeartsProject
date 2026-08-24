import type { ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  CLASS_MAX_DURATION_MINUTES_DEFAULT,
  CLASS_MIN_LEAD_MINUTES_DEFAULT,
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
import type { UpdateClassroomDto } from './dto/update-classroom.dto';
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
 * La configuración temporal del aula (HU-212), con los valores de fábrica salvo
 * que un test necesite otros.
 *
 * Se falsea entera en vez de leer el entorno: los dos umbrales **salen de la
 * configuración**, así que un test que dependiera del `.env` de quien lo corre
 * probaría una cosa distinta en cada máquina.
 */
function configuracion(
  overrides: { classMinLeadMinutes?: number; classMaxDurationMinutes?: number } = {},
): AppConfigService {
  return {
    classMinLeadMinutes: CLASS_MIN_LEAD_MINUTES_DEFAULT,
    classMaxDurationMinutes: CLASS_MAX_DURATION_MINUTES_DEFAULT,
    ...overrides,
  } as AppConfigService;
}

/**
 * Monta el servicio con un Prisma falso.
 *
 * `create` devuelve lo que se le pasó, más los campos que pone la BD: así el
 * test comprueba lo que el servicio DECIDIÓ escribir, que es lo que las
 * garantías de la HU están afirmando.
 *
 * `findMany` es la consulta de solapamiento (HU-212) y por defecto no devuelve
 * nada: el profesor tiene la agenda libre salvo que el test diga lo contrario.
 */
function setup(
  options: {
    teacherEnBd?: { role: UserRole; status: UserStatus } | null;
    agenda?: ReturnType<typeof aulaEnAgenda>[];
    config?: Parameters<typeof configuracion>[0];
  } = {},
) {
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

  const findMany = vi.fn().mockResolvedValue(options.agenda ?? []);

  const prisma = {
    user: { findUnique },
    classroom: { create, findMany },
  } as unknown as PrismaService;
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);

  return {
    service: new ClassroomsService(prisma, cipher, configuracion(options.config)),
    create,
    findUnique,
    findMany,
    cipher,
  };
}

/** Un aula ya publicada del profesor, tal y como la devuelve la consulta de solapamiento. */
function aulaEnAgenda(overrides: { id?: string; title?: string; hora: string; duracion?: number }) {
  return {
    id: overrides.id ?? '44444444-4444-4444-8444-444444444444',
    title: overrides.title ?? 'Conversación cotidiana',
    scheduledAt: new Date(`2027-08-12T${overrides.hora}:00.000Z`),
    durationMinutes: overrides.duracion ?? 60,
  };
}

/** Extrae el `code` del cuerpo de la excepción: es lo que ve el frontend. */
async function codigoDe(promise: Promise<unknown>): Promise<string> {
  return (await cuerpoDe(promise)).code;
}

/**
 * El cuerpo entero de la excepción. Los errores de HU-212 llevan `details`, y
 * ese `details` **es** el acceptance criteria (AC5, AC6, AC7): un código pelado
 * no le sirve al profesor para saber con qué chocó ni cuál era el máximo.
 */
async function cuerpoDe(
  promise: Promise<unknown>,
): Promise<{ code: string; message: string; details?: Record<string, unknown> }> {
  try {
    await promise;
  } catch (error) {
    return (error as ForbiddenException).getResponse() as {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
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

/**
 * HU-212 — coherencia temporal del aula.
 *
 * Lo que se prueba aquí es **la decisión del servicio**: qué código sale, qué
 * `details` lleva, qué se le pide a la BD y en qué orden se comprueban las tres
 * reglas. La aritmética de "solaparse" tiene sus propios tests en
 * `coherencia-temporal.rules.spec.ts`; duplicarla aquí solo la ataría al mock.
 */
describe('ClassroomsService.createClassroom — solapamiento del profesor (AC1–AC3, AC5)', () => {
  // AC1: el caso literal de la HU. 18:00–19:00 ocupado, se intenta 18:30–19:30.
  it('rechaza un aula que se solapa con otra PUBLISHED del propio profesor', async () => {
    const { service, create } = setup({ agenda: [aulaEnAgenda({ hora: '18:00' })] });

    const codigo = await codigoDe(
      service.createClassroom(
        profesorDelToken,
        entrada({ scheduledAt: '2027-08-12T18:30:00.000Z' }),
      ),
    );

    expect(codigo).toBe(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT);
    // No basta con responder el error: el aula NO puede haberse escrito.
    expect(create).not.toHaveBeenCalled();
  });

  // AC5: el error nombra la clase y el horario con los que se choca. Sin esto,
  // el profesor tiene que buscar el conflicto a mano entre sus aulas.
  it('el error nombra el aula que ocupa el horario, con su id, inicio y duración', async () => {
    const { service } = setup({
      agenda: [
        aulaEnAgenda({
          id: '55555555-5555-4555-8555-555555555555',
          title: 'Inglés para el trabajo',
          hora: '18:00',
          duracion: 90,
        }),
      ],
    });

    const cuerpo = await cuerpoDe(
      service.createClassroom(
        profesorDelToken,
        entrada({ scheduledAt: '2027-08-12T19:00:00.000Z' }),
      ),
    );

    expect(cuerpo.details).toEqual({
      conflictoId: '55555555-5555-4555-8555-555555555555',
      conflictoTitulo: 'Inglés para el trabajo',
      conflictoScheduledAt: '2027-08-12T18:00:00.000Z',
      conflictoDurationMinutes: 90,
    });
    // El mensaje también la nombra: llega al profesor tal cual si el frontend
    // no tuviera copy para este código.
    expect(cuerpo.message).toContain('Inglés para el trabajo');
  });

  // AC2: el borde. Es el horario más normal que puede tener un profesor —dos
  // clases seguidas— y bloquearlo haría la regla inservible.
  it('permite empezar exactamente cuando termina la anterior', async () => {
    const { service, create } = setup({ agenda: [aulaEnAgenda({ hora: '18:00' })] });

    await service.createClassroom(
      profesorDelToken,
      entrada({ scheduledAt: '2027-08-12T19:00:00.000Z' }),
    );

    expect(create).toHaveBeenCalledOnce();
  });

  // AC3: un aula cancelada no ocupa a nadie. Se comprueba en el `where` porque
  // es ahí donde se decide: el filtro es de la consulta, no de la aritmética.
  it('solo mira aulas PUBLISHED del propio profesor', async () => {
    const { service, findMany } = setup();

    await service.createClassroom(profesorDelToken, entrada());

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { teacherId: PROFESOR_ID, status: ClassroomStatus.PUBLISHED },
    });
  });

  it('no mira el aula de otro profesor, aunque ocupe el mismo horario', async () => {
    const { service, findMany } = setup();

    await service.createClassroom(profesorDelToken, entrada());

    const { where } = findMany.mock.calls[0]?.[0] as { where: { teacherId: string } };
    expect(where.teacherId).toBe(PROFESOR_ID);
    expect(where.teacherId).not.toBe(OTRO_PROFESOR_ID);
  });

  // AC4. La edición es HU-202, pero la regla que la hace posible se construye
  // aquí: sin `excluirId`, un `PATCH` que no mueve el horario chocaría contra
  // el aula que se está editando.
  it('al editar, excluye el aula que se edita para que no choque consigo misma', async () => {
    const { service, findMany } = setup();

    await service.assertCoherenciaTemporal({
      teacherId: PROFESOR_ID,
      scheduledAt: new Date('2027-08-12T18:00:00.000Z'),
      durationMinutes: 60,
      excluirId: '66666666-6666-4666-8666-666666666666',
    });

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: { not: '66666666-6666-4666-8666-666666666666' } },
    });
  });

  it('al crear no excluye ningún id: no hay aula que excluir todavía', async () => {
    const { service, findMany } = setup();

    await service.createClassroom(profesorDelToken, entrada());

    const { where } = findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> };
    expect(where).not.toHaveProperty('id');
  });
});

describe('ClassroomsService.createClassroom — duración máxima (AC6)', () => {
  it('rechaza una duración por encima del máximo y dice cuál era el máximo', async () => {
    const { service, create } = setup();

    const cuerpo = await cuerpoDe(
      service.createClassroom(profesorDelToken, entrada({ durationMinutes: 10_000 })),
    );

    expect(cuerpo.code).toBe(ApiErrorCode.CLASSROOM_DURATION_INVALID);
    expect(cuerpo.details).toEqual({ maximoMinutos: CLASS_MAX_DURATION_MINUTES_DEFAULT });
    expect(create).not.toHaveBeenCalled();
  });

  it('acepta exactamente el máximo', async () => {
    const { service, create } = setup();

    await service.createClassroom(
      profesorDelToken,
      entrada({ durationMinutes: CLASS_MAX_DURATION_MINUTES_DEFAULT }),
    );

    expect(create).toHaveBeenCalledOnce();
  });

  // El máximo sale del entorno, no del DTO: por eso el error tiene código
  // propio y devuelve el número. Si el servidor no mandara el suyo, el
  // formulario mostraría el de fábrica y mentiría.
  it('aplica el máximo configurado, no el de fábrica', async () => {
    const { service } = setup({ config: { classMaxDurationMinutes: 90 } });

    const cuerpo = await cuerpoDe(
      service.createClassroom(profesorDelToken, entrada({ durationMinutes: 120 })),
    );

    expect(cuerpo.code).toBe(ApiErrorCode.CLASSROOM_DURATION_INVALID);
    expect(cuerpo.details).toEqual({ maximoMinutos: 90 });
  });

  // La duración va primero porque el solapamiento se calcula contra
  // `scheduledAt + durationMinutes`: con una duración imposible, el intervalo
  // que se consultaría no significa nada.
  it('no llega a consultar la agenda si la duración ya es inválida', async () => {
    const { service, findMany } = setup();

    await codigoDe(service.createClassroom(profesorDelToken, entrada({ durationMinutes: 10_000 })));

    expect(findMany).not.toHaveBeenCalled();
  });
});

describe('ClassroomsService.createClassroom — antelación mínima (AC7)', () => {
  /** Un horario a `minutos` de ahora, según el reloj real del servidor. */
  const dentroDe = (minutos: number): string =>
    new Date(Date.now() + minutos * 60_000).toISOString();

  it('avisa, sin publicar, cuando falta menos que la antelación mínima', async () => {
    const { service, create } = setup();

    const cuerpo = await cuerpoDe(
      service.createClassroom(profesorDelToken, entrada({ scheduledAt: dentroDe(10) })),
    );

    expect(cuerpo.code).toBe(ApiErrorCode.CLASSROOM_LEAD_TIME_WARNING);
    expect(cuerpo.details).toMatchObject({ minimoMinutos: CLASS_MIN_LEAD_MINUTES_DEFAULT });
    // El diálogo explica cuánta antelación hay; el número sale del reloj del
    // servidor, así que solo se acota.
    expect(cuerpo.details?.minutosDeAntelacion).toBeLessThan(CLASS_MIN_LEAD_MINUTES_DEFAULT);
    expect(create).not.toHaveBeenCalled();
  });

  // El corazón del AC7: es un aviso, no un bloqueo.
  it('publica la misma clase si el profesor confirma', async () => {
    const { service, create } = setup();

    await service.createClassroom(
      profesorDelToken,
      entrada({ scheduledAt: dentroDe(10), confirmarPocaAntelacion: true }),
    );

    expect(create).toHaveBeenCalledOnce();
  });

  // El flag es el acuse de recibo de un aviso, no un campo del aula.
  it('la confirmación no se guarda en la base de datos', async () => {
    const { service, create } = setup();

    await service.createClassroom(
      profesorDelToken,
      entrada({ scheduledAt: dentroDe(10), confirmarPocaAntelacion: true }),
    );

    expect(datosEscritos(create)).not.toHaveProperty('confirmarPocaAntelacion');
  });

  it('no avisa cuando la antelación llega justo al mínimo', async () => {
    const { service, create } = setup();

    // Un segundo de margen: `minutosDeAntelacion` trunca hacia abajo y el reloj
    // avanza entre que se construye el horario y se comprueba.
    await service.createClassroom(
      profesorDelToken,
      entrada({ scheduledAt: dentroDe(CLASS_MIN_LEAD_MINUTES_DEFAULT + 1) }),
    );

    expect(create).toHaveBeenCalledOnce();
  });

  it('aplica el mínimo configurado, no el de fábrica', async () => {
    const { service } = setup({ config: { classMinLeadMinutes: 120 } });

    const cuerpo = await cuerpoDe(
      service.createClassroom(profesorDelToken, entrada({ scheduledAt: dentroDe(90) })),
    );

    expect(cuerpo.code).toBe(ApiErrorCode.CLASSROOM_LEAD_TIME_WARNING);
    expect(cuerpo.details).toMatchObject({ minimoMinutos: 120 });
  });

  // Decisión 5 de la HU: el profesor puede saltarse la antelación, nunca el
  // solapamiento. Confirmar no es una llave maestra.
  it('la confirmación NO salta el solapamiento', async () => {
    const { service, create } = setup({ agenda: [aulaEnAgenda({ hora: '18:00' })] });

    const codigo = await codigoDe(
      service.createClassroom(
        profesorDelToken,
        entrada({ scheduledAt: '2027-08-12T18:30:00.000Z', confirmarPocaAntelacion: true }),
      ),
    );

    expect(codigo).toBe(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT);
    expect(create).not.toHaveBeenCalled();
  });

  // El aviso va el último: pedirle al profesor que confirme una clase que iba a
  // ser rechazada por solaparse sería hacerle decidir sobre algo inexistente.
  it('si choca Y tiene poca antelación, responde el conflicto, no el aviso', async () => {
    const enBreve = dentroDe(10);
    const { service } = setup({
      agenda: [{ ...aulaEnAgenda({ hora: '18:00' }), scheduledAt: new Date(enBreve) }],
    });

    const codigo = await codigoDe(
      service.createClassroom(
        profesorDelToken,
        entrada({ scheduledAt: enBreve, confirmarPocaAntelacion: false }),
      ),
    );

    expect(codigo).toBe(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT);
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

  return { service: new ClassroomsService(prisma, cipher, configuracion()), findMany, count };
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

  return { service: new ClassroomsService(prisma, cipher, configuracion()), findMany, count };
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

  return { service: new ClassroomsService(prisma, cipher, configuracion()), findUnique, cifrado };
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
 * PATCH /classrooms/:id y POST /classrooms/:id/cancel — editar y cancelar
 * (HU-202, extendiendo HU-211)
 * ------------------------------------------------------------------------- */

function entradaEdicion(overrides: Partial<UpdateClassroomDto> = {}): UpdateClassroomDto {
  return { ...overrides };
}

/** Monta el servicio solo con lo que necesitan `editClassroom` y `cancelClassroom`. */
function setupEditar(
  aula: Record<string, unknown> | null,
  options: { agenda?: ReturnType<typeof aulaEnAgenda>[] } = {},
) {
  const findUnique = vi.fn().mockResolvedValue(aula === null ? null : filaDeAula(aula));
  const update = vi
    .fn()
    .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve(filaDeAula({ ...aula, ...data })),
    );
  const findMany = vi.fn().mockResolvedValue(options.agenda ?? []);
  const prisma = { classroom: { findUnique, update, findMany } } as unknown as PrismaService;
  const cipher = new MeetingLinkCipher({ meetingLinkKey: 'a'.repeat(64) } as AppConfigService);

  return {
    service: new ClassroomsService(prisma, cipher, configuracion()),
    findUnique,
    update,
    findMany,
  };
}

describe('ClassroomsService.editClassroom', () => {
  it('el dueño edita un campo cualquiera', async () => {
    const { service, update } = setupEditar({ teacherId: PROFESOR_ID });

    const classroom = await service.editClassroom(
      profesorDelToken,
      ID_DEL_AULA,
      entradaEdicion({ title: 'Nuevo título' }),
    );

    expect(update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: ID_DEL_AULA },
      data: { title: 'Nuevo título' },
    });
    expect(classroom.title).toBe('Nuevo título');
  });

  // AC5: una edición parcial no toca el resto de campos.
  it('editar solo un campo no manda el resto en `data`', async () => {
    const { service, update } = setupEditar({ teacherId: PROFESOR_ID });

    await service.editClassroom(profesorDelToken, ID_DEL_AULA, entradaEdicion({ maxStudents: 12 }));

    const data = update.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(data).toEqual({ maxStudents: 12 });
  });

  // AC4: el enlace nuevo se guarda cifrado, nunca en claro.
  it('si el enlace cambia, se vuelve a cifrar', async () => {
    const { service, update } = setupEditar({ teacherId: PROFESOR_ID });
    const otroEnlace = 'https://zoom.us/j/otra-sala';

    await service.editClassroom(
      profesorDelToken,
      ID_DEL_AULA,
      entradaEdicion({ meetingLink: otroEnlace }),
    );

    const guardado = (update.mock.calls[0]?.[0].data as Record<string, unknown>)
      .meetingLink as string;
    expect(guardado).not.toContain(otroEnlace);
    expect(guardado).toMatch(/^v1\./);
  });

  it('otro profesor recibe CLASSROOM_FORBIDDEN, y no se escribe nada', async () => {
    const { service, update } = setupEditar({ teacherId: PROFESOR_ID });

    expect(await codigoDe(service.editClassroom(otroProfesor, ID_DEL_AULA, entradaEdicion()))).toBe(
      ApiErrorCode.CLASSROOM_FORBIDDEN,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('un id que no existe responde CLASSROOM_NOT_FOUND', async () => {
    const { service, update } = setupEditar(null);

    expect(
      await codigoDe(service.editClassroom(profesorDelToken, ID_DEL_AULA, entradaEdicion())),
    ).toBe(ApiErrorCode.CLASSROOM_NOT_FOUND);
    expect(update).not.toHaveBeenCalled();
  });

  describe('editabilidad (AC3)', () => {
    it('un aula que ya empezó responde CLASSROOM_NOT_EDITABLE', async () => {
      const { service, update } = setupEditar({
        teacherId: PROFESOR_ID,
        scheduledAt: new Date('2020-01-01T00:00:00.000Z'),
      });

      expect(
        await codigoDe(service.editClassroom(profesorDelToken, ID_DEL_AULA, entradaEdicion())),
      ).toBe(ApiErrorCode.CLASSROOM_NOT_EDITABLE);
      expect(update).not.toHaveBeenCalled();
    });

    it('un aula ya CANCELLED responde CLASSROOM_NOT_EDITABLE', async () => {
      const { service, update } = setupEditar({
        teacherId: PROFESOR_ID,
        status: ClassroomStatus.CANCELLED,
      });

      expect(
        await codigoDe(service.editClassroom(profesorDelToken, ID_DEL_AULA, entradaEdicion())),
      ).toBe(ApiErrorCode.CLASSROOM_NOT_EDITABLE);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('coherencia temporal al editar (deuda de HU-212, AC4)', () => {
    it('editar sin mover el horario no choca consigo misma', async () => {
      // La consulta real la excluiría por `where.id.not` (Prisma la filtra en la
      // BD); aquí se comprueba que el servicio la pide con esa exclusión.
      const { service, update, findMany } = setupEditar({
        teacherId: PROFESOR_ID,
        scheduledAt: new Date('2027-08-12T23:00:00.000Z'),
      });

      await service.editClassroom(
        profesorDelToken,
        ID_DEL_AULA,
        entradaEdicion({ scheduledAt: '2027-08-12T23:00:00.000Z' }),
      );

      expect(findMany.mock.calls[0]?.[0]).toMatchObject({ where: { id: { not: ID_DEL_AULA } } });
      expect(update).toHaveBeenCalledOnce();
    });

    it('mover el horario a uno ocupado por otra aula responde TEACHER_SCHEDULE_CONFLICT', async () => {
      const { service, update } = setupEditar(
        { teacherId: PROFESOR_ID },
        { agenda: [aulaEnAgenda({ hora: '18:00' })] },
      );

      expect(
        await codigoDe(
          service.editClassroom(
            profesorDelToken,
            ID_DEL_AULA,
            entradaEdicion({ scheduledAt: '2027-08-12T18:30:00.000Z' }),
          ),
        ),
      ).toBe(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT);
      expect(update).not.toHaveBeenCalled();
    });

    it('editar un campo ajeno al horario no vuelve a comprobar la agenda', async () => {
      const { service, findMany } = setupEditar({ teacherId: PROFESOR_ID });

      await service.editClassroom(
        profesorDelToken,
        ID_DEL_AULA,
        entradaEdicion({ title: 'Otro título' }),
      );

      expect(findMany).not.toHaveBeenCalled();
    });
  });
});

describe('ClassroomsService.cancelClassroom', () => {
  it('el dueño cancela su aula', async () => {
    const { service, update } = setupEditar({ teacherId: PROFESOR_ID });

    const classroom = await service.cancelClassroom(profesorDelToken, ID_DEL_AULA);

    expect(update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: ID_DEL_AULA },
      data: { status: ClassroomStatus.CANCELLED },
    });
    expect(classroom.status).toBe(ClassroomStatus.CANCELLED);
  });

  it('otro profesor recibe CLASSROOM_FORBIDDEN, y no se cancela nada', async () => {
    const { service, update } = setupEditar({ teacherId: PROFESOR_ID });

    expect(await codigoDe(service.cancelClassroom(otroProfesor, ID_DEL_AULA))).toBe(
      ApiErrorCode.CLASSROOM_FORBIDDEN,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('un id que no existe responde CLASSROOM_NOT_FOUND', async () => {
    const { service, update } = setupEditar(null);

    expect(await codigoDe(service.cancelClassroom(profesorDelToken, ID_DEL_AULA))).toBe(
      ApiErrorCode.CLASSROOM_NOT_FOUND,
    );
    expect(update).not.toHaveBeenCalled();
  });

  // Cancelar dos veces no es un éxito silencioso.
  it('cancelar un aula ya CANCELLED responde CLASSROOM_NOT_EDITABLE', async () => {
    const { service, update } = setupEditar({
      teacherId: PROFESOR_ID,
      status: ClassroomStatus.CANCELLED,
    });

    expect(await codigoDe(service.cancelClassroom(profesorDelToken, ID_DEL_AULA))).toBe(
      ApiErrorCode.CLASSROOM_NOT_EDITABLE,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('un aula que ya empezó no se puede cancelar', async () => {
    const { service, update } = setupEditar({
      teacherId: PROFESOR_ID,
      scheduledAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    expect(await codigoDe(service.cancelClassroom(profesorDelToken, ID_DEL_AULA))).toBe(
      ApiErrorCode.CLASSROOM_NOT_EDITABLE,
    );
    expect(update).not.toHaveBeenCalled();
  });
});
