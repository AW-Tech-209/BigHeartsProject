import { Injectable } from '@nestjs/common';
import type { Classroom as PrismaClassroom, Prisma } from '@prisma/client';
import {
  type Classroom,
  CLASSROOMS_PAGE_SIZE_DEFAULT,
  type ClassroomDetail,
  ClassroomStatus,
  ESTADO_TEMPORAL_POR_DEFECTO,
  EstadoTemporalAula,
  type ListClassroomsResponse,
  MeetingProvider,
  type MisAulasResponse,
  UserRole,
  UserStatus,
} from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { insufficientRole } from '../auth/auth.errors';
import { PrismaService } from '../prisma/prisma.service';
import { toClassroomDetail, toClassroomListItem, toPublicClassroom } from './classroom.mapper';
import { classroomNotFound, teacherNotActive, teacherProfileNotFound } from './classrooms.errors';
import type { CreateClassroomDto } from './dto/create-classroom.dto';
import type { ListClassroomsDto } from './dto/list-classrooms.dto';
import type { ListMisAulasDto } from './dto/list-mis-aulas.dto';
import { MeetingLinkCipher } from './meeting-link.cipher';

@Injectable()
export class ClassroomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingLinks: MeetingLinkCipher,
  ) {}

  /**
   * Crea un aula a nombre del profesor autenticado (HU-201).
   *
   * `teacher` viene del token, y ese es el único origen posible del dueño: el
   * DTO no declara `teacherId`, así que el cuerpo no tiene forma de nombrar a
   * otra persona.
   */
  async createClassroom(teacher: AuthenticatedUser, input: CreateClassroomDto): Promise<Classroom> {
    await this.assertPuedeCrearAulas(teacher.id);

    const classroom = await this.prisma.classroom.create({
      data: {
        teacherId: teacher.id,
        title: input.title,
        description: input.description,
        level: input.level,
        maxStudents: input.maxStudents,
        // Prisma lo escribe en una columna `timestamptz`: la cadena ISO lleva
        // zona explícita (lo garantiza el DTO), así que el instante se conserva
        // sea cual sea la zona del servidor (§4.7).
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        // El dato más sensible del producto no toca la BD en claro (§4.1).
        meetingLink: this.meetingLinks.encrypt(input.meetingLink),

        // Los tres campos que decide el servidor. Se escriben EXPLÍCITAMENTE
        // aunque el esquema ya los tenga como default: así el valor con el que
        // nace un aula se lee aquí, y un cambio de default en una migración
        // futura no altera en silencio el comportamiento de este endpoint.
        meetingProvider: MeetingProvider.MANUAL,
        status: ClassroomStatus.PUBLISHED,
        currentBookings: 0,
      },
    });

    return toPublicClassroom(classroom);
  }

  /**
   * Catálogo de aulas disponibles (HU-203, A1–A4). Sin `@Roles`: la ve
   * cualquier usuario autenticado.
   *
   * Solo lectura: a diferencia de `createClassroom`, no hay
   * `SELECT … FOR UPDATE` porque nada se muta aquí (§4.2 solo lo exige para
   * la transacción que escribe `currentBookings`).
   */
  async listClassrooms(query: ListClassroomsDto): Promise<ListClassroomsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;

    // `scheduledAt` aparece dos veces a propósito: como cláusulas separadas
    // del array `AND`, no como dos claves del mismo objeto (que se pisarían
    // entre sí). Así "excluir lo ya pasado" y el rango desde/hasta se
    // combinan sin que uno tape al otro.
    const where: Prisma.ClassroomWhereInput = {
      AND: [
        { status: ClassroomStatus.PUBLISHED },
        // A2: fuera también lo que ya pasó, no solo lo CANCELLED — `COMPLETED`
        // no tiene escritor todavía (D16), así que filtrar solo por estado
        // dejaría clases viejas en la lista.
        { scheduledAt: { gt: new Date() } },
        ...(query.level ? [{ level: query.level }] : []),
        ...(query.desde ? [{ scheduledAt: { gte: new Date(query.desde) } }] : []),
        ...(query.hasta ? [{ scheduledAt: { lte: new Date(query.hasta) } }] : []),
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        include: { teacher: { select: { firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.classroom.count({ where }),
    ]);

    return {
      items: rows.map((row) => toClassroomListItem(row, row.teacher)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Detalle de un aula (HU-204, A1). Lo ve **cualquier usuario autenticado**:
   * es la pantalla a la que lleva cada tarjeta del catálogo.
   *
   * Un aula `CANCELLED` **se devuelve igual**, con su estado (A3). No aparece
   * en el catálogo, pero quien tenga el enlace de la página debe poder entender
   * qué pasó en vez de toparse con un 404 —que se lee como un fallo de la
   * plataforma justo cuando el usuario está confundido—.
   *
   * `myBookingStatus` llega `null` sin consultar nada: el modelo `Booking` no
   * existe hasta el Sprint 3. Lo rellena HU-301.
   */
  async getClassroomDetail(
    viewer: AuthenticatedUser,
    classroomId: string,
  ): Promise<ClassroomDetail> {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { teacher: { select: { firstName: true, lastName: true } } },
    });

    if (!classroom) {
      throw classroomNotFound();
    }

    const puedeVerlo = this.revelarElEnlace(viewer, classroom);

    return toClassroomDetail(classroom, classroom.teacher, {
      // Se descifra SOLO si va a viajar: sin esta condición, el texto en claro
      // existiría en memoria en cada petición de cualquier usuario, y bastaría
      // un log de la variable para filtrarlo.
      ...(puedeVerlo && { meetingLink: this.meetingLinks.decrypt(classroom.meetingLink) }),
      myBookingStatus: null,
    });
  }

  /**
   * **El único punto del servidor que decide si el enlace viaja** (A2, §4.1).
   *
   * En el Sprint 2 la regla completa es «el que pide es el profesor dueño».
   * `Booking` no existe todavía, así que la otra mitad de §4.1 —un estudiante
   * con reserva `CONFIRMED`, y solo desde `scheduledAt − ACCESS_WINDOW_MINUTES`—
   * no tiene forma de evaluarse.
   *
   * **HU-303 extiende ESTE método**, no el endpoint: le añade la rama del
   * estudiante y la comparación temporal contra el reloj del servidor. Si
   * alguien necesita revelar el enlace desde otro sitio, la respuesta es llamar
   * aquí, nunca escribir una segunda condición — un permiso decidido en dos
   * lugares acaba divergiendo, y este es el dato más sensible del producto.
   *
   * **Un aula cancelada no revela su enlace a nadie, ni al dueño** (decisión de
   * auditoría 3 de HU-204). Esa reunión no va a ocurrir: dar la URL solo
   * serviría para que alguien entre a una sala que ya nadie atiende.
   *
   * No hace falta comprobar el rol: solo un `TEACHER` puede ser `teacherId` de
   * un aula, así que la identidad ya lo implica.
   */
  private revelarElEnlace(viewer: AuthenticatedUser, classroom: PrismaClassroom): boolean {
    if (classroom.status === ClassroomStatus.CANCELLED) {
      return false;
    }

    return viewer.id === classroom.teacherId;
  }

  /**
   * «Mis aulas»: el registro completo del profesor autenticado (HU-207).
   *
   * **El `teacherId` sale del token y de ningún otro sitio** (§4.8, regla 3).
   * El DTO no lo declara, así que ni el query string ni el cuerpo tienen forma
   * de nombrar a otra persona: no existe la petición «dame las aulas de X».
   *
   * A diferencia de `createClassroom`, aquí **no** se comprueba el estado del
   * profesor contra la BD. Leer lo propio no tiene efectos sobre nadie más, y
   * un profesor suspendido debe poder seguir viendo qué impartió — quitárselo
   * sería castigar con pérdida de historial.
   *
   * `meetingLink` no viaja: `toPublicClassroom` nunca lo copia, y esa es la
   * garantía, no una comprobación de este método.
   */
  async listMisAulas(
    teacher: AuthenticatedUser,
    query: ListMisAulasDto,
  ): Promise<MisAulasResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? CLASSROOMS_PAGE_SIZE_DEFAULT;
    const estado = query.estado ?? ESTADO_TEMPORAL_POR_DEFECTO;
    // Un único instante para toda la petición: con dos `new Date()` distintos,
    // un aula que empieza justo ahora podría contarse en el `count` y faltar en
    // el `findMany`, y la paginación quedaría descuadrada por una fila.
    const ahora = new Date();
    const skip = (page - 1) * pageSize;

    const { rows, total } =
      estado === EstadoTemporalAula.TODAS
        ? await this.leerTodasMisAulas(teacher.id, ahora, skip, pageSize)
        : await this.leerMisAulasPorEstado(teacher.id, estado, ahora, skip, pageSize);

    return { items: rows.map(toPublicClassroom), total, page, pageSize };
  }

  /**
   * Uno de los tres grupos disjuntos de `EstadoTemporalAula`, paginado.
   *
   * El orden lo fija A3: **próximas ascendente** —la más cercana primero, que
   * es la que el profesor tiene que preparar— y todo lo demás **descendente**,
   * lo más reciente primero, que es como se lee un historial.
   */
  private async leerMisAulasPorEstado(
    teacherId: string,
    estado: Exclude<EstadoTemporalAula, EstadoTemporalAula.TODAS>,
    ahora: Date,
    skip: number,
    take: number,
  ) {
    const where = {
      [EstadoTemporalAula.PROXIMAS]: proximasDe(teacherId, ahora),
      [EstadoTemporalAula.PASADAS]: pasadasDe(teacherId, ahora),
      [EstadoTemporalAula.CANCELADAS]: canceladasDe(teacherId),
    }[estado];

    const orderBy: Prisma.ClassroomOrderByWithRelationInput = {
      scheduledAt: estado === EstadoTemporalAula.PROXIMAS ? 'asc' : 'desc',
    };

    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({ where, orderBy, skip, take }),
      this.prisma.classroom.count({ where }),
    ]);

    return { rows, total };
  }

  /**
   * `todas`, que **no es una consulta con otro filtro sino dos listas
   * concatenadas**: primero las próximas ascendente, después el historial
   * descendente (A3, AC7).
   *
   * Se resuelve con dos consultas y no con un `ORDER BY` porque el orden que
   * pide la HU depende del reloj —cambia de sentido en `now`— y Prisma no
   * ordena por una expresión. La alternativa era `$queryRaw`, que se saltaría
   * el mapeo tipado por un caso que se resuelve en quince líneas aquí.
   *
   * El reparto de la página: se toman las próximas que quepan y, si sobra
   * hueco, se rellena con el historial desde donde toque. Los dos conjuntos son
   * complementarios (`cancelada ∨ pasada` es la negación de `próxima`), así que
   * ninguna aula sale dos veces ni se pierde entre páginas.
   */
  private async leerTodasMisAulas(teacherId: string, ahora: Date, skip: number, take: number) {
    const whereProximas = proximasDe(teacherId, ahora);
    const whereHistorial = historialDe(teacherId, ahora);

    const [totalProximas, totalHistorial] = await Promise.all([
      this.prisma.classroom.count({ where: whereProximas }),
      this.prisma.classroom.count({ where: whereHistorial }),
    ]);

    const proximas =
      skip < totalProximas
        ? await this.prisma.classroom.findMany({
            where: whereProximas,
            orderBy: { scheduledAt: 'asc' },
            skip,
            take,
          })
        : [];

    const huecoRestante = take - proximas.length;
    const historial =
      huecoRestante > 0
        ? await this.prisma.classroom.findMany({
            where: whereHistorial,
            orderBy: { scheduledAt: 'desc' },
            // Cuando la página empieza dentro de las próximas, el historial
            // arranca en su primera fila: `skip - totalProximas` es negativo.
            skip: Math.max(skip - totalProximas, 0),
            take: huecoRestante,
          })
        : [];

    return { rows: [...proximas, ...historial], total: totalProximas + totalHistorial };
  }

  /**
   * El profesor tiene que estar `ACTIVE` para publicar clases
   * (`ARQUITECTURA.md` §4.5).
   *
   * **El estado se lee de la BD, no del token, y esa es toda la razón de que
   * este método exista.** El access token lleva `role` y `status`, pero es una
   * foto de hasta 15 minutos: un profesor suspendido hace cinco minutos sigue
   * presentando un token que dice `ACTIVE`, y con él publicaría aulas que otros
   * pueden reservar. Las 15 000 consultas ahorradas no valen esa ventana.
   *
   * El `role` se revisa aquí por lo mismo, aunque el `RolesGuard` ya lo haya
   * mirado: el guard decide con el token, esto decide con la fila.
   */
  private async assertPuedeCrearAulas(teacherId: string): Promise<void> {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true, status: true },
    });

    if (!teacher) {
      throw teacherProfileNotFound();
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw insufficientRole();
    }

    if (teacher.status !== UserStatus.ACTIVE) {
      throw teacherNotActive(teacher.status as UserStatus);
    }
  }
}

/**
 * Los tres grupos de «Mis aulas», como cláusulas de Prisma.
 *
 * Son **disjuntos y exhaustivos** a propósito: `proximas ∪ pasadas ∪
 * canceladas` es exactamente el conjunto de aulas del profesor, sin
 * intersección. De ahí que una cancelada del mes que viene cuente como
 * `canceladas` y no como `proximas`: si estuviera en las dos, el filtro
 * `todas` la duplicaría y los totales dejarían de sumar.
 *
 * **El corte temporal es `scheduledAt`, no el instante de fin.** Una clase que
 * empezó hace diez minutos ya cuenta como pasada aquí, aunque
 * `derivarEstadoAula()` la pinte —correctamente— como `en-curso` en la tarjeta.
 * Es el mismo corte que usa el catálogo público, y comparar contra
 * `scheduledAt + durationMinutes` exigiría una expresión sobre dos columnas que
 * Prisma no sabe filtrar. La coherencia fina del eje temporal es HU-212.
 */
function proximasDe(teacherId: string, ahora: Date): Prisma.ClassroomWhereInput {
  return {
    teacherId,
    status: { not: ClassroomStatus.CANCELLED },
    scheduledAt: { gt: ahora },
  };
}

function pasadasDe(teacherId: string, ahora: Date): Prisma.ClassroomWhereInput {
  return {
    teacherId,
    status: { not: ClassroomStatus.CANCELLED },
    scheduledAt: { lte: ahora },
  };
}

function canceladasDe(teacherId: string): Prisma.ClassroomWhereInput {
  return { teacherId, status: ClassroomStatus.CANCELLED };
}

/**
 * Todo lo que no es «próxima»: el bloque de abajo del filtro `todas`. Es la
 * negación exacta de {@link proximasDe}, y por eso se escribe como un `OR` y no
 * como la suma de {@link pasadasDe} y {@link canceladasDe} — así la
 * complementariedad se lee en el código y no depende de que dos cláusulas
 * separadas sigan encajando.
 */
function historialDe(teacherId: string, ahora: Date): Prisma.ClassroomWhereInput {
  return {
    teacherId,
    OR: [{ status: ClassroomStatus.CANCELLED }, { scheduledAt: { lte: ahora } }],
  };
}
