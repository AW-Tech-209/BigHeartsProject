import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApiErrorCode,
  type EnglishLevel,
  type InstructionMode,
  METRICAS_RANGO_MAX_DIAS,
  type MetricasAcademia,
  type MetricasIndicadores,
  type MetricasQuery,
  ProblemaClase,
} from '@academia/types';

import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';

const DIA_MS = 86_400_000;
const DEFAULT_DIAS = 30;
const MAX_COMENTARIOS = 50;

type Num = bigint | number;

interface Medidas {
  clases: Num;
  reservas: Num;
  cupo: Num;
  asistieron: Num;
  marcadas: Num;
}

const razon = (num: Num, den: Num): number | null =>
  Number(den) === 0 ? null : Number(num) / Number(den);

const indicadores = (r: Medidas): MetricasIndicadores => ({
  clases: Number(r.clases),
  ocupacion: razon(r.reservas, r.cupo),
  asistencia: razon(r.asistieron, r.marcadas),
});

function rangoInvalido(message: string): BadRequestException {
  return new BadRequestException({
    code: ApiErrorCode.VALIDATION_ERROR,
    message: 'Los datos enviados no son válidos.',
    fields: [{ field: 'desde', message }],
  });
}

function diaUtc(fecha: string): number | null {
  const ms = Date.parse(`${fecha}T00:00:00Z`);
  return Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== fecha ? null : ms;
}

/**
 * Métricas de la academia para el ADMIN (HU-516). Todo se agrega en SQL: nunca
 * se cargan reservas ni aulas individuales en memoria.
 */
@Injectable()
export class AdminMetricasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async obtener(query: MetricasQuery): Promise<MetricasAcademia> {
    const tz = this.config.academyTimezone;
    const { desde, hasta } = await this.resolverRango(query, tz);

    // Límites en UTC de los días locales de la academia, ambos inclusivos.
    const [limites] = await this.prisma.$queryRaw<{ lo: Date; hi: Date }[]>`
      SELECT (${desde}::date)::timestamp AT TIME ZONE ${tz} AS lo,
             ((${hasta}::date) + 1)::timestamp AT TIME ZONE ${tz} AS hi`;
    const { lo, hi } = limites!;

    // Una fila por aula del rango, con sus reservas ya agregadas.
    const aulas = Prisma.sql`
      WITH aulas AS (
        SELECT c.id, c.status::text AS status, c.level::text AS level,
               c.instruction_mode::text AS modo, c.teacher_id, c.max_students,
               c.scheduled_at,
               (c.status <> 'CANCELLED' AND c.ends_at < now()) AS impartida,
               COUNT(b.id) FILTER (WHERE b.status IN ('CONFIRMED','ATTENDED','NO_SHOW')) AS reservas,
               COUNT(b.id) FILTER (WHERE b.status = 'ATTENDED') AS asistieron,
               COUNT(b.id) FILTER (WHERE b.status IN ('ATTENDED','NO_SHOW')) AS marcadas,
               COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED') AS pendientes,
               COUNT(b.id) FILTER (WHERE b.status = 'CANCELLED') AS canceladas
        FROM classrooms c
        LEFT JOIN bookings b ON b.classroom_id = c.id
        WHERE c.status <> 'DRAFT' AND c.scheduled_at >= ${lo} AND c.scheduled_at < ${hi}
        GROUP BY c.id
      )`;

    const medidas = Prisma.sql`
      COUNT(*) AS clases,
      COALESCE(SUM(reservas), 0) AS reservas,
      COALESCE(SUM(max_students), 0) AS cupo,
      COALESCE(SUM(asistieron), 0) AS asistieron,
      COALESCE(SUM(marcadas), 0) AS marcadas`;

    const [
      [resumenFila],
      [personasFila],
      franjas,
      niveles,
      modos,
      profesores,
      seguimiento,
      problemas,
      comentarios,
    ] = await Promise.all([
      this.prisma.$queryRaw<
        (Medidas & {
          publicadas: Num;
          canceladas: Num;
          sinMarcar: Num;
          cancelacionesEstudiantes: Num;
        })[]
      >`${aulas}
        SELECT COUNT(*) FILTER (WHERE status IN ('PUBLISHED','COMPLETED')) AS publicadas,
               COUNT(*) FILTER (WHERE status = 'CANCELLED') AS canceladas,
               COUNT(*) FILTER (WHERE impartida) AS clases,
               COALESCE(SUM(reservas) FILTER (WHERE impartida), 0) AS reservas,
               COALESCE(SUM(max_students) FILTER (WHERE impartida), 0) AS cupo,
               COALESCE(SUM(asistieron) FILTER (WHERE impartida), 0) AS asistieron,
               COALESCE(SUM(marcadas) FILTER (WHERE impartida), 0) AS marcadas,
               COUNT(*) FILTER (WHERE impartida AND pendientes > 0) AS "sinMarcar",
               COALESCE(SUM(canceladas), 0) AS "cancelacionesEstudiantes"
        FROM aulas`,
      this.prisma.$queryRaw<{ activos: Num; nuevos: Num }[]>`
        SELECT (SELECT COUNT(DISTINCT b.student_id)
                  FROM bookings b JOIN classrooms c ON c.id = b.classroom_id
                 WHERE b.status IN ('CONFIRMED','ATTENDED','NO_SHOW')
                   AND c.status <> 'DRAFT'
                   AND c.scheduled_at >= ${lo} AND c.scheduled_at < ${hi}) AS activos,
               (SELECT COUNT(*) FROM users
                 WHERE role = 'STUDENT' AND created_at >= ${lo} AND created_at < ${hi}) AS nuevos`,
      this.prisma.$queryRaw<(Medidas & { dia: number; hora: number })[]>`${aulas}
        SELECT EXTRACT(ISODOW FROM scheduled_at AT TIME ZONE ${tz})::int AS dia,
               EXTRACT(HOUR FROM scheduled_at AT TIME ZONE ${tz})::int AS hora, ${medidas}
        FROM aulas WHERE impartida GROUP BY dia, hora ORDER BY dia, hora`,
      this.prisma.$queryRaw<(Medidas & { level: string })[]>`${aulas}
        SELECT level, ${medidas} FROM aulas WHERE impartida GROUP BY level ORDER BY level`,
      this.prisma.$queryRaw<(Medidas & { modo: string | null })[]>`${aulas}
        SELECT modo, ${medidas} FROM aulas WHERE impartida GROUP BY modo ORDER BY modo`,
      this.prisma.$queryRaw<(Medidas & { id: string; nombre: string })[]>`${aulas}
        SELECT u.id, u.first_name || ' ' || u.last_name AS nombre, ${medidas}
        FROM aulas JOIN users u ON u.id = aulas.teacher_id
        WHERE impartida GROUP BY u.id ORDER BY nombre`,
      this.prisma.$queryRaw<{ seguimiento: string; total: Num }[]>`
        SELECT f.seguimiento::text AS seguimiento, COUNT(*) AS total
        FROM class_feedback f
        JOIN bookings b ON b.id = f.booking_id
        JOIN classrooms c ON c.id = b.classroom_id
        WHERE c.scheduled_at >= ${lo} AND c.scheduled_at < ${hi}
        GROUP BY f.seguimiento`,
      this.prisma.$queryRaw<{ problema: string; total: Num }[]>`
        SELECT p::text AS problema, COUNT(*) AS total
        FROM class_feedback f
        JOIN bookings b ON b.id = f.booking_id
        JOIN classrooms c ON c.id = b.classroom_id
        CROSS JOIN LATERAL unnest(f.problemas) AS p
        WHERE c.scheduled_at >= ${lo} AND c.scheduled_at < ${hi}
        GROUP BY p`,
      this.prisma.classFeedback.findMany({
        where: {
          comentario: { not: null },
          booking: { classroom: { scheduledAt: { gte: lo, lt: hi } } },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_COMENTARIOS,
        select: {
          comentario: true,
          booking: { select: { classroom: { select: { title: true, scheduledAt: true } } } },
        },
      }),
    ]);

    // Ambos son agregados sin GROUP BY: siempre devuelven una fila.
    const resumen = resumenFila!;
    const personas = personasFila!;

    const porSeguimiento = new Map(seguimiento.map((s) => [s.seguimiento, Number(s.total)]));
    const si = porSeguimiento.get('SI') ?? 0;
    const aMedias = porSeguimiento.get('A_MEDIAS') ?? 0;
    const no = porSeguimiento.get('NO') ?? 0;
    const conteoProblemas = Object.fromEntries(
      Object.values(ProblemaClase).map((p) => [p, 0]),
    ) as Record<ProblemaClase, number>;
    for (const fila of problemas) {
      conteoProblemas[fila.problema as ProblemaClase] = Number(fila.total);
    }

    return {
      desde,
      hasta,
      zonaHoraria: tz,
      resumen: {
        clasesPublicadas: Number(resumen.publicadas),
        clasesCanceladas: Number(resumen.canceladas),
        clasesImpartidas: Number(resumen.clases),
        ocupacion: razon(resumen.reservas, resumen.cupo),
        asistencia: razon(resumen.asistieron, resumen.marcadas),
        clasesSinAsistenciaMarcada: Number(resumen.sinMarcar),
        cancelacionesDeEstudiantes: Number(resumen.cancelacionesEstudiantes),
        estudiantesActivos: Number(personas.activos),
        estudiantesNuevos: Number(personas.nuevos),
      },
      porFranja: franjas.map((f) => ({ diaSemana: f.dia, hora: f.hora, ...indicadores(f) })),
      porNivel: niveles.map((n) => ({ nivel: n.level as EnglishLevel, ...indicadores(n) })),
      porModo: modos.map((m) => ({ modo: m.modo as InstructionMode | null, ...indicadores(m) })),
      porProfesor: profesores.map((p) => ({
        profesorId: p.id,
        nombre: p.nombre,
        ...indicadores(p),
      })),
      valoraciones: {
        respuestas: si + aMedias + no,
        si,
        aMedias,
        no,
        problemas: conteoProblemas,
        comentarios: comentarios.map((c) => ({
          comentario: c.comentario ?? '',
          claseTitulo: c.booking.classroom.title,
          claseFecha: c.booking.classroom.scheduledAt.toISOString(),
        })),
      },
    };
  }

  private async resolverRango(query: MetricasQuery, tz: string) {
    let hasta = query.hasta;
    if (!hasta) {
      const [fila] = await this.prisma.$queryRaw<{ hoy: string }[]>`
        SELECT to_char(now() AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS hoy`;
      hasta = fila!.hoy;
    }
    const finMs = diaUtc(hasta);
    if (finMs === null) throw rangoInvalido('La fecha de fin no es válida.');

    const desde =
      query.desde ?? new Date(finMs - (DEFAULT_DIAS - 1) * DIA_MS).toISOString().slice(0, 10);
    const inicioMs = diaUtc(desde);
    if (inicioMs === null) throw rangoInvalido('La fecha de inicio no es válida.');
    if (inicioMs > finMs) {
      throw rangoInvalido('La fecha de inicio no puede ser posterior a la de fin.');
    }
    if ((finMs - inicioMs) / DIA_MS + 1 > METRICAS_RANGO_MAX_DIAS) {
      throw rangoInvalido(`El rango no puede superar ${METRICAS_RANGO_MAX_DIAS} días.`);
    }
    return { desde, hasta };
  }
}
