/**
 * Seed de SHOWCASE: una estudiante con una historia creíble para grabar el
 * recorrido completo (panel → catálogo → reservar → entrar a la clase →
 * historial → valorar). A diferencia de `seed-demo.ts`, no busca cubrir casos
 * de borde: nombres, títulos y horarios reales (hora de Bogotá, en punto).
 *
 *   npm run db:seed:showcase                       (desde la raíz del repo)
 *   SHOWCASE_PROXIMA_MIN=20 npm run db:seed:showcase  (la próxima clase abre en 10 min)
 *
 * Idempotente: `upsert` por email en usuarios y por id fijo (rango `5c0e…`) en
 * aulas, reservas y valoraciones. Reejecutarlo justo antes de grabar refresca
 * las fechas. Las marcas de recordatorio se dejan puestas para que el cron no
 * escriba a estas cuentas ficticias.
 *
 * Cuenta principal: valentina.rojas@bighearts.local / Password123!
 *
 *   PROXIMA     empieza en +8 min (configurable) · reservada → enlace visible
 *   MANANA      mañana 18:00 · reservada
 *   JUEVES      +3 días 19:00 · reservada
 *   VIAJAR      +2 días 18:00 · con cupo, sin reservar → para reservar en vivo
 *   RUTINA      +2 días 10:00 · 5/6 → últimos cupos
 *   LECTURA     +4 días 18:00 · 4/4 → llena
 *   PHRASAL     +5 días 17:00 · con cupo
 *   DELETREO    +6 días 18:00 · con cupo, coincide con su preferencia
 *   CORREOS     +8 días 19:00 · con cupo
 *   SALUDOS     hace 2 días · asistió, SIN valorar → botón «valorar» visible
 *   NUMEROS     hace 5 días · asistió y valoró
 *   COLORES     hace 9 días · asistió y valoró (a medias, subtítulos)
 *   CONVERSA    hace 7 días · la canceló ella
 *   TO_BE       hace 12 días · asistió
 *   ALFABETO    hace 16 días · asistió
 */
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import {
  PrismaClient,
  type BookingStatus,
  type ProblemaClase,
  type SeguimientoClase,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

import { BCRYPT_SALT_ROUNDS } from '../src/auth/auth.constants';
import { finDelAula } from '../src/classrooms/coherencia-temporal.rules';
import type { AppConfigService } from '../src/config/app-config.service';
import { MeetingLinkCipher } from '../src/classrooms/meeting-link.cipher';

loadEnv({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const PASSWORD = process.env.SEED_DEMO_PASSWORD?.trim() || 'Password123!';
const PROXIMA_MIN = Number(process.env.SHOWCASE_PROXIMA_MIN ?? 8);

/** Bogotá es UTC−5 todo el año (sin horario de verano). */
const OFFSET_BOGOTA_H = -5;

/** `dias` desde hoy a las `hora`:`min` de Bogotá, en UTC. */
function diaA(dias: number, hora: number, min = 0): Date {
  const ahoraBogota = new Date(Date.now() + OFFSET_BOGOTA_H * 3_600_000);
  return new Date(
    Date.UTC(
      ahoraBogota.getUTCFullYear(),
      ahoraBogota.getUTCMonth(),
      ahoraBogota.getUTCDate() + dias,
      hora - OFFSET_BOGOTA_H,
      min,
    ),
  );
}

function enMinutos(minutos: number): Date {
  const d = new Date(Date.now() + minutos * 60_000);
  d.setUTCSeconds(0, 0);
  return d;
}

const D = '@bighearts.local';
const VALE = `valentina.rojas${D}`;
const LAURA = `laura.mendez${D}`;
const ANDRES = `andres.gomez${D}`;
const CAMILA = `camila.torres${D}`;

type Usuario = {
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER';
  hearingLossLevel?: 'MILD' | 'MODERATE' | 'SEVERE' | 'PROFOUND';
  preferredInstructionMode?: 'LSC_NATIVA' | 'INTERPRETE_LSC';
  preferredSupports?: ('LIP_READING' | 'WRITTEN_TEXT' | 'LIVE_CAPTIONS' | 'VISUAL_MATERIALS')[];
};

const COMPAS = [
  ['juan.perez', 'Juan', 'Pérez', 'SEVERE', 'LSC_NATIVA'],
  ['mariana.lopez', 'Mariana', 'López', 'PROFOUND', 'LSC_NATIVA'],
  ['santiago.ramirez', 'Santiago', 'Ramírez', 'MODERATE', 'INTERPRETE_LSC'],
  ['daniela.castro', 'Daniela', 'Castro', 'SEVERE', 'INTERPRETE_LSC'],
  ['felipe.herrera', 'Felipe', 'Herrera', 'PROFOUND', 'LSC_NATIVA'],
  ['natalia.vargas', 'Natalia', 'Vargas', 'MODERATE', 'INTERPRETE_LSC'],
  ['sebastian.morales', 'Sebastián', 'Morales', 'SEVERE', 'LSC_NATIVA'],
  ['isabela.ortiz', 'Isabela', 'Ortiz', 'PROFOUND', 'LSC_NATIVA'],
] as const;
const COMPA = (i: number) => `${COMPAS[i][0]}${D}`;

const USUARIOS: Usuario[] = [
  {
    email: VALE,
    firstName: 'Valentina',
    lastName: 'Rojas',
    role: 'STUDENT',
    hearingLossLevel: 'PROFOUND',
    preferredInstructionMode: 'LSC_NATIVA',
    preferredSupports: ['VISUAL_MATERIALS', 'WRITTEN_TEXT'],
  },
  { email: LAURA, firstName: 'Laura', lastName: 'Méndez', role: 'TEACHER' },
  { email: ANDRES, firstName: 'Andrés', lastName: 'Gómez', role: 'TEACHER' },
  { email: CAMILA, firstName: 'Camila', lastName: 'Torres', role: 'TEACHER' },
  ...COMPAS.map(
    ([user, firstName, lastName, hearingLossLevel, preferredInstructionMode]): Usuario => ({
      email: `${user}${D}`,
      firstName,
      lastName,
      role: 'STUDENT',
      hearingLossLevel,
      preferredInstructionMode,
    }),
  ),
];

type Aula = {
  key: string;
  teacher: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  maxStudents: number;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink: string;
  meetingProvider: 'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS';
  instructionMode: 'LSC_NATIVA' | 'INTERPRETE_LSC';
  supports: Usuario['preferredSupports'];
  /** Valentina: estado de su reserva, o ninguna. */
  vale?: BookingStatus;
  /** Índices de `COMPAS` que también reservaron. */
  compas: number[];
};

const AULAS: Aula[] = [
  {
    key: 'PROXIMA',
    teacher: LAURA,
    title: 'Small talk: presentarte en una reunión',
    description:
      'Frases para saludar, decir a qué te dedicas y hacer preguntas sencillas. Practicamos en parejas con tarjetas visuales.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledAt: enMinutos(PROXIMA_MIN),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/bhs-smal-talk',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['VISUAL_MATERIALS', 'WRITTEN_TEXT'],
    vale: 'CONFIRMED',
    compas: [0, 1, 4, 7],
  },
  {
    key: 'MANANA',
    teacher: ANDRES,
    title: 'Inglés para entrevistas de trabajo',
    description:
      'Cómo hablar de tu experiencia y tus fortalezas. Andrés enseña en inglés escrito con intérprete de LSC durante toda la clase.',
    level: 'INTERMEDIATE',
    maxStudents: 10,
    scheduledAt: diaA(1, 18),
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/8125550101',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['WRITTEN_TEXT', 'LIVE_CAPTIONS'],
    vale: 'CONFIRMED',
    compas: [2, 3, 5],
  },
  {
    key: 'JUEVES',
    teacher: LAURA,
    title: 'Present Simple con historias visuales',
    description:
      'Contamos rutinas con viñetas y fotos. Cada estudiante arma su propia historia en inglés.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledAt: diaA(3, 19),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/bhs-pres-simp',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['VISUAL_MATERIALS'],
    vale: 'CONFIRMED',
    compas: [1, 6],
  },
  {
    key: 'VIAJAR',
    teacher: CAMILA,
    title: 'Inglés para viajar: aeropuerto y hotel',
    description:
      'Check-in, preguntar por la puerta de embarque y resolver problemas en el hotel. Con intérprete de LSC y subtítulos en vivo.',
    level: 'BEGINNER',
    maxStudents: 10,
    scheduledAt: diaA(2, 18),
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/8125550102',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['LIVE_CAPTIONS', 'VISUAL_MATERIALS'],
    compas: [2, 5, 7],
  },
  {
    key: 'RUTINA',
    teacher: LAURA,
    title: 'Conversación guiada: mi día a día',
    description: 'Grupo pequeño para practicar preguntas y respuestas sobre la rutina diaria.',
    level: 'BEGINNER',
    maxStudents: 6,
    scheduledAt: diaA(2, 10),
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/bhs-mi-rutina',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['WRITTEN_TEXT'],
    compas: [0, 1, 4, 6, 7],
  },
  {
    key: 'LECTURA',
    teacher: ANDRES,
    title: 'Club de lectura: cuentos cortos',
    description: 'Leemos un cuento corto antes de clase y lo comentamos por escrito y en señas.',
    level: 'ADVANCED',
    maxStudents: 4,
    scheduledAt: diaA(4, 18),
    durationMinutes: 90,
    meetingLink: 'https://zoom.us/j/8125550103',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['WRITTEN_TEXT'],
    compas: [2, 3, 5, 6],
  },
  {
    key: 'PHRASAL',
    teacher: CAMILA,
    title: 'Phrasal verbs del día a día',
    description: 'Get up, turn on, pick up… Los verbos que más aparecen en series y mensajes.',
    level: 'INTERMEDIATE',
    maxStudents: 12,
    scheduledAt: diaA(5, 17),
    durationMinutes: 60,
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/bhs-phrasal',
    meetingProvider: 'MICROSOFT_TEAMS',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['LIP_READING', 'WRITTEN_TEXT'],
    compas: [3, 5],
  },
  {
    key: 'DELETREO',
    teacher: LAURA,
    title: 'Deletreo manual en inglés (ASL)',
    description:
      'El alfabeto manual de ASL frente al de LSC: deletrear nombres, correos y palabras nuevas.',
    level: 'BEGINNER',
    maxStudents: 10,
    scheduledAt: diaA(6, 18),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/bhs-asl-spell',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['VISUAL_MATERIALS'],
    compas: [4],
  },
  {
    key: 'CORREOS',
    teacher: ANDRES,
    title: 'Escribir correos formales',
    description: 'Estructura, saludos y despedidas para escribirle a un jefe o a un cliente.',
    level: 'INTERMEDIATE',
    maxStudents: 10,
    scheduledAt: diaA(8, 19),
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/8125550104',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['WRITTEN_TEXT', 'LIVE_CAPTIONS'],
    compas: [],
  },
  // ── Pasadas: historial ──
  {
    key: 'SALUDOS',
    teacher: LAURA,
    title: 'Saludos y presentaciones',
    description: 'Hello, nice to meet you: presentarse, deletrear el nombre y decir de dónde eres.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledAt: diaA(-2, 18),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/bhs-saludos-1',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['VISUAL_MATERIALS'],
    vale: 'ATTENDED',
    compas: [0, 1, 4, 7],
  },
  {
    key: 'NUMEROS',
    teacher: ANDRES,
    title: 'Números, fechas y horas',
    description: 'Decir la hora, pedir una cita y entender fechas escritas en inglés.',
    level: 'BEGINNER',
    maxStudents: 10,
    scheduledAt: diaA(-5, 19),
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/8125550105',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['WRITTEN_TEXT', 'LIVE_CAPTIONS'],
    vale: 'ATTENDED',
    compas: [2, 3, 5],
  },
  {
    key: 'CONVERSA',
    teacher: ANDRES,
    title: 'Conversación libre',
    description: 'Tema abierto para practicar lo visto en la semana.',
    level: 'INTERMEDIATE',
    maxStudents: 8,
    scheduledAt: diaA(-7, 18),
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/8125550106',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['LIVE_CAPTIONS'],
    vale: 'CANCELLED',
    compas: [2, 5],
  },
  {
    key: 'COLORES',
    teacher: CAMILA,
    title: 'Colores y descripción de personas',
    description: 'Describir la ropa, el pelo y los rasgos de alguien con adjetivos básicos.',
    level: 'BEGINNER',
    maxStudents: 10,
    scheduledAt: diaA(-9, 18),
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/8125550107',
    meetingProvider: 'ZOOM',
    instructionMode: 'INTERPRETE_LSC',
    supports: ['LIVE_CAPTIONS', 'VISUAL_MATERIALS'],
    vale: 'ATTENDED',
    compas: [0, 3, 6],
  },
  {
    key: 'TO_BE',
    teacher: LAURA,
    title: 'El verbo to be',
    description: 'I am, you are, she is: afirmar, negar y preguntar con ejemplos visuales.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledAt: diaA(-12, 18),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/bhs-verb-tobe',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['VISUAL_MATERIALS', 'WRITTEN_TEXT'],
    vale: 'ATTENDED',
    compas: [1, 4, 7],
  },
  {
    key: 'ALFABETO',
    teacher: LAURA,
    title: 'Bienvenida: el alfabeto en inglés',
    description: 'Primera clase: conocernos, el alfabeto escrito y el manual de ASL.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledAt: diaA(-16, 18),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/bhs-alfabeto',
    meetingProvider: 'GOOGLE_MEET',
    instructionMode: 'LSC_NATIVA',
    supports: ['VISUAL_MATERIALS'],
    vale: 'ATTENDED',
    compas: [0, 1, 4, 6, 7],
  },
];

type Valoracion = {
  aula: string;
  /** `-1` = Valentina. */
  quien: number;
  seguimiento: SeguimientoClase;
  problemas?: ProblemaClase[];
  comentario?: string;
};

const VALORACIONES: Valoracion[] = [
  // SALUDOS: los compañeros ya valoraron; Valentina no, para hacerlo en vivo.
  { aula: 'SALUDOS', quien: 0, seguimiento: 'SI', comentario: 'Las tarjetas ayudaron mucho.' },
  { aula: 'SALUDOS', quien: 1, seguimiento: 'SI' },
  { aula: 'SALUDOS', quien: 4, seguimiento: 'A_MEDIAS', problemas: ['RITMO'] },
  {
    aula: 'NUMEROS',
    quien: -1,
    seguimiento: 'SI',
    comentario: 'El intérprete fue muy claro con las horas.',
  },
  { aula: 'NUMEROS', quien: 2, seguimiento: 'SI' },
  { aula: 'NUMEROS', quien: 3, seguimiento: 'A_MEDIAS', problemas: ['CONEXION'] },
  {
    aula: 'COLORES',
    quien: -1,
    seguimiento: 'A_MEDIAS',
    problemas: ['SUBTITULOS'],
    comentario: 'Los subtítulos se atrasaban un poco.',
  },
  { aula: 'COLORES', quien: 0, seguimiento: 'SI' },
  { aula: 'COLORES', quien: 6, seguimiento: 'SI' },
];

const id = (bloque: string, n: number) =>
  `5c0e0000-0000-4000-${bloque}-${String(n).padStart(12, '0')}`;

async function main(): Promise<void> {
  const meetingLinkKey = process.env.MEETING_LINK_KEY;
  if (!meetingLinkKey || !process.env.DATABASE_URL) {
    throw new Error('Faltan DATABASE_URL o MEETING_LINK_KEY en apps/api/.env.');
  }
  const cipher = new MeetingLinkCipher({ meetingLinkKey } as AppConfigService);
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_SALT_ROUNDS);
  const ahora = new Date();

  const userId = new Map<string, string>();
  for (const u of USUARIOS) {
    const data = {
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      status: 'ACTIVE' as const,
      mustChangePassword: false,
      temporaryPasswordExpiresAt: null,
      hearingLossLevel: u.hearingLossLevel ?? null,
      preferredInstructionMode: u.preferredInstructionMode ?? null,
      preferredSupports: u.preferredSupports ?? [],
    };
    const { id: uid } = await prisma.user.upsert({
      where: { email: u.email },
      update: { ...data, password: passwordHash },
      create: { email: u.email, password: passwordHash, ...data },
      select: { id: true },
    });
    userId.set(u.email, uid);
  }
  console.log(`  ✔ ${USUARIOS.length} usuarios`);

  let nReserva = 0;
  const reservaId = new Map<string, string>(); // `${aula}:${quien}` → id
  for (const [i, aula] of AULAS.entries()) {
    const classroomId = id('a000', i + 1);
    const reservas: { quien: number; email: string; status: BookingStatus }[] = [
      ...(aula.vale ? [{ quien: -1, email: VALE, status: aula.vale }] : []),
      ...aula.compas.map((c) => ({
        quien: c,
        email: COMPA(c),
        status: (aula.scheduledAt < ahora ? 'ATTENDED' : 'CONFIRMED') as BookingStatus,
      })),
    ];
    const ocupadas = reservas.filter((r) => r.status !== 'CANCELLED').length;
    if (ocupadas > aula.maxStudents) throw new Error(`${aula.key}: más reservas que cupo`);

    const data = {
      teacherId: userId.get(aula.teacher)!,
      title: aula.title,
      description: aula.description,
      level: aula.level,
      maxStudents: aula.maxStudents,
      scheduledAt: aula.scheduledAt,
      durationMinutes: aula.durationMinutes,
      endsAt: finDelAula(aula),
      meetingLink: cipher.encrypt(aula.meetingLink),
      meetingProvider: aula.meetingProvider,
      status: 'PUBLISHED' as const,
      instructionMode: aula.instructionMode,
      supports: aula.supports ?? [],
      currentBookings: ocupadas,
    };
    await prisma.classroom.upsert({
      where: { id: classroomId },
      update: data,
      create: { id: classroomId, ...data },
    });

    // Lo reservado en vivo durante una toma anterior se borra: el cupo vuelve al guion.
    const fijas = reservas.map((_, k) => id('b000', nReserva + k + 1));
    const ajenas = { classroomId, id: { notIn: fijas } };
    await prisma.classFeedback.deleteMany({ where: { booking: ajenas } });
    await prisma.booking.deleteMany({ where: ajenas });

    for (const r of reservas) {
      const bookingId = id('b000', ++nReserva);
      reservaId.set(`${aula.key}:${r.quien}`, bookingId);
      const enviado = aula.scheduledAt > ahora ? ahora : null;
      const bData = {
        studentId: userId.get(r.email)!,
        classroomId,
        status: r.status,
        cancelledAt:
          r.status === 'CANCELLED' ? new Date(aula.scheduledAt.getTime() - 26 * 3_600_000) : null,
        reminder24hSentAt: enviado,
        reminderAccesoSentAt: enviado,
      };
      await prisma.booking.upsert({
        where: { id: bookingId },
        update: bData,
        create: { id: bookingId, ...bData },
      });
    }
  }
  console.log(`  ✔ ${AULAS.length} aulas y ${nReserva} reservas`);

  // Si en una pasada anterior Valentina valoró SALUDOS en vivo, se borra para repetir la toma.
  await prisma.classFeedback.deleteMany({
    where: { bookingId: reservaId.get('SALUDOS:-1')! },
  });
  for (const [i, v] of VALORACIONES.entries()) {
    const feedbackId = id('c000', i + 1);
    const data = {
      bookingId: reservaId.get(`${v.aula}:${v.quien}`)!,
      seguimiento: v.seguimiento,
      problemas: v.problemas ?? [],
      comentario: v.comentario ?? null,
    };
    await prisma.classFeedback.upsert({
      where: { id: feedbackId },
      update: data,
      create: { id: feedbackId, ...data },
    });
  }
  console.log(`  ✔ ${VALORACIONES.length} valoraciones`);

  console.log(`\nShowcase listo. Entra con ${VALE} / ${PASSWORD}`);
  console.log(`La próxima clase empieza a las ${AULAS[0].scheduledAt.toISOString()} (UTC).`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed de showcase fallido:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
