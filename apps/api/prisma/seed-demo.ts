/**
 * Seed de DATOS DE PRUEBA. Es el escenario completo para trastear con la app o
 * para enseñársela al cliente: usuarios, aulas y reservas que cubren **todos los
 * casos** que la interfaz puede mostrar.
 *
 * NO lo ejecuta el deploy ni `docker compose up` — esos solo corren `seed.ts`
 * (el Admin). Este es aparte y MANUAL:
 *
 *   npm run db:seed:demo            (desde la raíz del repo)
 *
 * Todas las fechas se calculan contra `Date.now()` en el momento de correrlo,
 * así que los estados temporales de las aulas (`en-curso`, `acceso-abierto`,
 * `finalizada`…) son ciertos justo después de sembrar. Reejecutarlo solo
 * refresca las fechas: es idempotente (`upsert` por email en usuarios, por id
 * fijo en aulas y reservas, en el rango `d0c0…` que no colisiona con nada).
 *
 * Requiere `apps/api/.env` con `DATABASE_URL` y `MEETING_LINK_KEY` (los mismos
 * que usa la app). La contraseña de todas las cuentas es `Password123!` salvo
 * que definas `SEED_DEMO_PASSWORD`.
 *
 * ─── Escenarios que deja montados ──────────────────────────────────────────
 *
 * Aulas de `demo.profe@bighearts.local` / `demo.profe2@bighearts.local`. En «Mis
 * aulas» se ven todas; en el catálogo público solo las PUBLISHED futuras.
 *
 *   LEJANA          empieza en +7 días · cupo de sobra                → disponible
 *   ULTIMOS_CUPOS   empieza en +3 días · 5/6 ocupado                  → últimos-cupos
 *   LLENA           empieza en +2 días · 3/3 ocupado                  → llena
 *   RESERVADA       empieza en +2 días · el alumno demo ya reservó    → reservada (enlace aún-no)
 *   EMPIEZA_PRONTO  empieza en +25 min · dentro de la ventana de 30   → acceso-abierto (enlace visible)
 *   EN_CURSO        empezó hace 30 min, dura 45 · aún en marcha       → en-curso (enlace visible)
 *   LLEGUE_TARDE    empezó hace 90 min, terminó hace 30               → finalizada (enlace sin-acceso)
 *   FINALIZADA_HIST fue hace 6 días · asistencia marcada (profe 1)    → finalizada (historial)
 *   FINALIZADA_HIST_2 fue hace 4 días · asistencia marcada (profe 2)  → finalizada (historial)
 *   CANCELADA       el profesor la canceló                            → cancelada
 *   SIN_MODOS       sin modos de comunicación declarados (pre-HU-211) → disponible, sin distintivos de modo
 *   ACCESIBLE       señas + texto + intérprete + subtítulos + material→ disponible, con todos los apoyos
 *
 * Cuentas para probar el login y la cola de aprobación:
 *   demo.alumno@bighearts.local             STUDENT ACTIVE  (señas, hipoacusia severa) — dueño de las reservas
 *   demo.alumno2@bighearts.local            STUDENT ACTIVE  (texto escrito, hipoacusia moderada)
 *   demo.alumno.suspendido@bighearts.local  STUDENT SUSPENDED  — el login responde cuenta deshabilitada
 *   demo.profe.pendiente@bighearts.local    TEACHER PENDING    — aparece en la cola del admin
 *   demo.profe.rechazado@bighearts.local    TEACHER REJECTED   — el login responde solicitud denegada
 *   demo.relleno1..5@bighearts.local        STUDENT ACTIVE  — ocupan cupo; 1-3 con preferencia declarada
 *                                                             para que el panel del profesor resuma modos
 *
 * NOTA sobre «llegar tarde»: el enlace de una clase es visible para quien tiene
 * reserva desde 30 min antes y hasta que la clase TERMINA (`scheduledAt +
 * durationMinutes`), no solo hasta que empieza. El caso de «ya no puedo entrar»
 * es, por tanto, una clase ya terminada — que es lo que monta `LLEGUE_TARDE`.
 */
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import { PrismaClient, type BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { BCRYPT_SALT_ROUNDS } from '../src/auth/auth.constants';
import { finDelAula } from '../src/classrooms/coherencia-temporal.rules';
import type { AppConfigService } from '../src/config/app-config.service';
import { MeetingLinkCipher } from '../src/classrooms/meeting-link.cipher';

// `prisma db seed` carga `.env` solo; este script corre por ts-node suelto, así
// que lo carga a mano antes de instanciar el cliente de Prisma.
loadEnv({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Falta la variable de entorno ${name} (está en apps/api/.env).`);
  }
  return value;
}

/** Minutos (o negativos) desde ahora, como fecha absoluta. */
function desdeAhora(minutos: number): Date {
  return new Date(Date.now() + minutos * 60_000);
}

const MIN = 1;
const HORA = 60;
const DIA = 24 * 60;

const PASSWORD = process.env.SEED_DEMO_PASSWORD?.trim() || 'Password123!';

type Rol = 'STUDENT' | 'TEACHER';
type Estado = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
type ModoComunicacion = 'SIGN_LANGUAGE' | 'LIP_READING' | 'WRITTEN_TEXT' | 'SPOKEN_AUDIO';

export type UsuarioDemo = {
  email: string;
  firstName: string;
  lastName: string;
  role: Rol;
  status: Estado;
  hearingLossLevel?: 'MILD' | 'MODERATE' | 'SEVERE' | 'PROFOUND';
  communicationPreference?: ModoComunicacion;
};

const PROFE = 'demo.profe@bighearts.local';
const PROFE2 = 'demo.profe2@bighearts.local';
const ALUMNO = 'demo.alumno@bighearts.local';
const ALUMNO2 = 'demo.alumno2@bighearts.local';
const RELLENO = (n: number) => `demo.relleno${n}@bighearts.local`;

/** Preferencia de cada relleno: `null` = sin declarar. */
const PREFERENCIA_RELLENO: Record<number, ModoComunicacion | undefined> = {
  1: 'SIGN_LANGUAGE',
  2: 'LIP_READING',
  3: 'WRITTEN_TEXT',
};

export const USUARIOS: UsuarioDemo[] = [
  { email: PROFE, firstName: 'Paula', lastName: 'Profesora', role: 'TEACHER', status: 'ACTIVE' },
  { email: PROFE2, firstName: 'Diego', lastName: 'Docente', role: 'TEACHER', status: 'ACTIVE' },
  {
    email: 'demo.profe.pendiente@bighearts.local',
    firstName: 'Pedro',
    lastName: 'Pendiente',
    role: 'TEACHER',
    status: 'PENDING',
  },
  {
    email: 'demo.profe.rechazado@bighearts.local',
    firstName: 'Raúl',
    lastName: 'Rechazado',
    role: 'TEACHER',
    status: 'REJECTED',
  },
  {
    email: ALUMNO,
    firstName: 'Aitor',
    lastName: 'Alumno',
    role: 'STUDENT',
    status: 'ACTIVE',
    hearingLossLevel: 'SEVERE',
    communicationPreference: 'SIGN_LANGUAGE',
  },
  {
    email: ALUMNO2,
    firstName: 'Sara',
    lastName: 'Estudiante',
    role: 'STUDENT',
    status: 'ACTIVE',
    hearingLossLevel: 'MODERATE',
    communicationPreference: 'WRITTEN_TEXT',
  },
  {
    email: 'demo.alumno.suspendido@bighearts.local',
    firstName: 'Sonia',
    lastName: 'Suspendida',
    role: 'STUDENT',
    status: 'SUSPENDED',
  },
  ...[1, 2, 3, 4, 5].map((n): UsuarioDemo => ({
    email: RELLENO(n),
    firstName: `Relleno${n}`,
    lastName: 'Demo',
    role: 'STUDENT',
    status: 'ACTIVE',
    communicationPreference: PREFERENCIA_RELLENO[n],
  })),
];

export type AulaDemo = {
  id: string;
  teacherEmail: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  maxStudents: number;
  scheduledInMinutes: number;
  durationMinutes: number;
  meetingLink: string;
  meetingProvider: 'MANUAL' | 'GOOGLE_MEET' | 'ZOOM';
  communicationModes: ModoComunicacion[];
  status?: 'PUBLISHED' | 'CANCELLED';
  hasInterpreter?: boolean;
  hasLiveCaptions?: boolean;
  hasVisualMaterials?: boolean;
};

const idAula = (n: number) => `d0c00000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`;
const idReserva = (n: number) => `d0c00000-0000-4000-9000-0000000000${String(n).padStart(2, '0')}`;

export const AULA = {
  LEJANA: idAula(1),
  ULTIMOS_CUPOS: idAula(2),
  LLENA: idAula(3),
  RESERVADA: idAula(4),
  EMPIEZA_PRONTO: idAula(5),
  EN_CURSO: idAula(6),
  LLEGUE_TARDE: idAula(7),
  FINALIZADA_HIST: idAula(8),
  CANCELADA: idAula(9),
  SIN_MODOS: idAula(10),
  ACCESIBLE: idAula(11),
  FINALIZADA_HIST_2: idAula(12),
};

export const AULAS: AulaDemo[] = [
  {
    id: AULA.LEJANA,
    teacherEmail: PROFE,
    title: 'Inglés A1 — empieza la semana que viene',
    description: 'Conversación básica a ritmo tranquilo, en lengua de señas con intérprete.',
    level: 'BEGINNER',
    maxStudents: 10,
    scheduledInMinutes: 7 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-lejana',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE'],
    hasInterpreter: true,
  },
  {
    id: AULA.ULTIMOS_CUPOS,
    teacherEmail: PROFE,
    title: 'Inglés B1 para el trabajo',
    description: 'Vocabulario de reuniones y correos. Con subtítulos en vivo.',
    level: 'INTERMEDIATE',
    maxStudents: 6,
    scheduledInMinutes: 3 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-ultimos-cupos',
    meetingProvider: 'ZOOM',
    communicationModes: ['WRITTEN_TEXT', 'LIP_READING'],
    hasLiveCaptions: true,
  },
  {
    id: AULA.LLENA,
    teacherEmail: PROFE2,
    title: 'Conversación C1 — grupo reducido',
    description: 'Debate de actualidad en grupo pequeño. Sin cupo libre.',
    level: 'ADVANCED',
    maxStudents: 3,
    scheduledInMinutes: 2 * DIA,
    durationMinutes: 90,
    meetingLink: 'https://zoom.us/j/demo-llena',
    meetingProvider: 'ZOOM',
    communicationModes: ['SPOKEN_AUDIO'],
    hasInterpreter: true,
  },
  {
    id: AULA.RESERVADA,
    teacherEmail: PROFE,
    title: 'Inglés A2 — dentro de dos días',
    description: 'El alumno de demo ya tiene su plaza en esta clase.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledInMinutes: 2 * DIA + 4 * HORA,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-reservada',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE'],
    hasInterpreter: true,
  },
  {
    id: AULA.EMPIEZA_PRONTO,
    teacherEmail: PROFE,
    title: 'Clase que empieza en breve',
    description: 'Empieza en minutos: quien tiene reserva ya ve el enlace.',
    level: 'INTERMEDIATE',
    maxStudents: 6,
    scheduledInMinutes: 25 * MIN,
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/demo-empieza-pronto',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE'],
    hasInterpreter: true,
    hasLiveCaptions: true,
  },
  {
    id: AULA.EN_CURSO,
    teacherEmail: PROFE,
    title: 'Clase en curso ahora mismo',
    description: 'Empezó hace media hora y sigue en marcha. El enlace está abierto.',
    level: 'INTERMEDIATE',
    maxStudents: 6,
    scheduledInMinutes: -30 * MIN,
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/demo-en-curso',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['LIP_READING'],
    hasLiveCaptions: true,
  },
  {
    id: AULA.LLEGUE_TARDE,
    teacherEmail: PROFE,
    title: 'Clase a la que llegué tarde',
    description: 'Empezó hace 90 minutos y ya terminó: el enlace dejó de estar disponible.',
    level: 'BEGINNER',
    maxStudents: 6,
    scheduledInMinutes: -90 * MIN,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-llegue-tarde',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE'],
  },
  {
    id: AULA.FINALIZADA_HIST,
    teacherEmail: PROFE,
    title: 'Clase de la semana pasada',
    description: 'Aula pasada con asistencia ya marcada, para el historial.',
    level: 'BEGINNER',
    maxStudents: 6,
    scheduledInMinutes: -6 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-finalizada-hist',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['WRITTEN_TEXT'],
  },
  {
    id: AULA.FINALIZADA_HIST_2,
    teacherEmail: PROFE2,
    title: 'Clase de hace unos días (profe 2)',
    description: 'Aula pasada del segundo profesor, con asistencia marcada mezclando resultados.',
    level: 'ADVANCED',
    maxStudents: 6,
    scheduledInMinutes: -4 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-finalizada-hist-2',
    meetingProvider: 'ZOOM',
    communicationModes: ['SIGN_LANGUAGE', 'WRITTEN_TEXT'],
    hasLiveCaptions: true,
  },
  {
    id: AULA.CANCELADA,
    teacherEmail: PROFE2,
    title: 'Clase cancelada por el profesor',
    description: 'El profesor canceló esta clase; la reserva del alumno queda anulada.',
    level: 'ADVANCED',
    maxStudents: 5,
    scheduledInMinutes: 4 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-cancelada',
    meetingProvider: 'ZOOM',
    communicationModes: ['SIGN_LANGUAGE'],
    status: 'CANCELLED',
  },
  {
    id: AULA.SIN_MODOS,
    teacherEmail: PROFE,
    title: 'Clase sin modos de comunicación indicados',
    description: 'Aula anterior a HU-211: el profesor no declaró en qué modos se imparte.',
    level: 'INTERMEDIATE',
    maxStudents: 10,
    scheduledInMinutes: 5 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-sin-modos',
    meetingProvider: 'MANUAL',
    communicationModes: [],
  },
  {
    id: AULA.ACCESIBLE,
    teacherEmail: PROFE,
    title: 'Clase con todos los apoyos de accesibilidad',
    description: 'Señas y texto, con intérprete, subtítulos en vivo y material visual.',
    level: 'BEGINNER',
    maxStudents: 12,
    scheduledInMinutes: 6 * DIA,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-accesible',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE', 'WRITTEN_TEXT'],
    hasInterpreter: true,
    hasLiveCaptions: true,
    hasVisualMaterials: true,
  },
];

export type ReservaDemo = {
  id: string;
  studentEmail: string;
  classroomId: string;
  status: BookingStatus;
  cancelledAtInMinutes?: number;
};

export const RESERVAS: ReservaDemo[] = [
  // El alumno de demo: una reserva en cada estado que quiere enseñarse. Tiene
  // las tres salidas del historial — asistió, no asistió y canceló.
  { id: idReserva(1), studentEmail: ALUMNO, classroomId: AULA.RESERVADA, status: 'CONFIRMED' },
  { id: idReserva(2), studentEmail: ALUMNO, classroomId: AULA.EMPIEZA_PRONTO, status: 'CONFIRMED' },
  { id: idReserva(3), studentEmail: ALUMNO, classroomId: AULA.EN_CURSO, status: 'CONFIRMED' },
  { id: idReserva(4), studentEmail: ALUMNO, classroomId: AULA.LLEGUE_TARDE, status: 'CONFIRMED' },
  { id: idReserva(5), studentEmail: ALUMNO, classroomId: AULA.FINALIZADA_HIST, status: 'ATTENDED' },
  { id: idReserva(6), studentEmail: ALUMNO, classroomId: AULA.CANCELADA, status: 'CONFIRMED' },
  {
    id: idReserva(7),
    studentEmail: ALUMNO,
    classroomId: AULA.SIN_MODOS,
    status: 'CANCELLED',
    cancelledAtInMinutes: -1 * DIA,
  },
  {
    id: idReserva(20),
    studentEmail: ALUMNO,
    classroomId: AULA.FINALIZADA_HIST_2,
    status: 'NO_SHOW',
  },
  // Segundo alumno: para enseñar «Mis reservas» de otra cuenta.
  { id: idReserva(8), studentEmail: ALUMNO2, classroomId: AULA.RESERVADA, status: 'CONFIRMED' },
  { id: idReserva(9), studentEmail: ALUMNO2, classroomId: AULA.FINALIZADA_HIST, status: 'NO_SHOW' },
  {
    id: idReserva(21),
    studentEmail: ALUMNO2,
    classroomId: AULA.FINALIZADA_HIST_2,
    status: 'ATTENDED',
  },
  // Relleno: ocupa cupo para los estados «llena» y «últimos cupos».
  { id: idReserva(10), studentEmail: RELLENO(1), classroomId: AULA.LEJANA, status: 'CONFIRMED' },
  { id: idReserva(11), studentEmail: RELLENO(2), classroomId: AULA.LEJANA, status: 'CONFIRMED' },
  {
    id: idReserva(12),
    studentEmail: RELLENO(1),
    classroomId: AULA.ULTIMOS_CUPOS,
    status: 'CONFIRMED',
  },
  {
    id: idReserva(13),
    studentEmail: RELLENO(2),
    classroomId: AULA.ULTIMOS_CUPOS,
    status: 'CONFIRMED',
  },
  {
    id: idReserva(14),
    studentEmail: RELLENO(3),
    classroomId: AULA.ULTIMOS_CUPOS,
    status: 'CONFIRMED',
  },
  {
    id: idReserva(15),
    studentEmail: RELLENO(4),
    classroomId: AULA.ULTIMOS_CUPOS,
    status: 'CONFIRMED',
  },
  {
    id: idReserva(16),
    studentEmail: RELLENO(5),
    classroomId: AULA.ULTIMOS_CUPOS,
    status: 'CONFIRMED',
  },
  { id: idReserva(17), studentEmail: RELLENO(1), classroomId: AULA.LLENA, status: 'CONFIRMED' },
  { id: idReserva(18), studentEmail: RELLENO(2), classroomId: AULA.LLENA, status: 'CONFIRMED' },
  { id: idReserva(19), studentEmail: RELLENO(3), classroomId: AULA.LLENA, status: 'CONFIRMED' },
  {
    id: idReserva(22),
    studentEmail: RELLENO(3),
    classroomId: AULA.FINALIZADA_HIST_2,
    status: 'ATTENDED',
  },
];

/**
 * Cuenta por aula las reservas que ocupan cupo: todo lo que no está `CANCELLED`
 * (marcar asistencia no libera el cupo, HU-403 AC4). Es lo único que decide
 * `currentBookings`.
 */
export function contarReservasConCupo(
  reservas: Pick<ReservaDemo, 'classroomId' | 'status'>[],
): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const r of reservas) {
    if (r.status === 'CANCELLED') continue;
    conteo.set(r.classroomId, (conteo.get(r.classroomId) ?? 0) + 1);
  }
  return conteo;
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_SALT_ROUNDS);
  const cipher = new MeetingLinkCipher({
    meetingLinkKey: requireEnv('MEETING_LINK_KEY'),
  } as AppConfigService);

  requireEnv('DATABASE_URL');

  for (const u of USUARIOS) {
    const data = {
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      status: u.status,
      hearingLossLevel: u.hearingLossLevel ?? null,
      communicationPreference: u.communicationPreference ?? null,
    };
    await prisma.user.upsert({
      where: { email: u.email },
      update: data,
      create: { email: u.email, password: passwordHash, ...data },
    });
  }
  console.log(`  ✔ ${USUARIOS.length} usuarios de prueba (contraseña: ${PASSWORD})`);

  const teachers = await prisma.user.findMany({
    where: { email: { in: [PROFE, PROFE2] } },
    select: { id: true, email: true },
  });
  const teacherId = new Map(teachers.map((t) => [t.email, t.id]));

  const cupo = contarReservasConCupo(RESERVAS);
  for (const aula of AULAS) {
    const scheduledAt = desdeAhora(aula.scheduledInMinutes);
    const data = {
      teacherId: teacherId.get(aula.teacherEmail)!,
      title: aula.title,
      description: aula.description,
      level: aula.level,
      maxStudents: aula.maxStudents,
      scheduledAt,
      durationMinutes: aula.durationMinutes,
      endsAt: finDelAula({ scheduledAt, durationMinutes: aula.durationMinutes }),
      meetingLink: cipher.encrypt(aula.meetingLink),
      meetingProvider: aula.meetingProvider,
      status: aula.status ?? 'PUBLISHED',
      communicationModes: aula.communicationModes,
      hasInterpreter: aula.hasInterpreter ?? false,
      hasLiveCaptions: aula.hasLiveCaptions ?? false,
      hasVisualMaterials: aula.hasVisualMaterials ?? false,
      currentBookings: aula.status === 'CANCELLED' ? 0 : (cupo.get(aula.id) ?? 0),
    };
    await prisma.classroom.upsert({
      where: { id: aula.id },
      update: data,
      create: { id: aula.id, ...data },
    });
  }
  console.log(`  ✔ ${AULAS.length} aulas de prueba`);

  const students = await prisma.user.findMany({
    where: { email: { in: [...new Set(RESERVAS.map((r) => r.studentEmail))] } },
    select: { id: true, email: true },
  });
  const studentId = new Map(students.map((s) => [s.email, s.id]));

  for (const r of RESERVAS) {
    const data = {
      studentId: studentId.get(r.studentEmail)!,
      classroomId: r.classroomId,
      status: r.status,
      cancelledAt: r.cancelledAtInMinutes !== undefined ? desdeAhora(r.cancelledAtInMinutes) : null,
    };
    await prisma.booking.upsert({
      where: { id: r.id },
      update: data,
      create: { id: r.id, ...data },
    });
  }
  console.log(`  ✔ ${RESERVAS.length} reservas de prueba`);

  console.log('\nSeed de prueba listo. Entra con demo.alumno@bighearts.local / ' + PASSWORD);
}

// Solo se ejecuta al lanzarlo como script (`npm run db:seed:demo`); al importarlo
// desde un test para revisar las invariantes de los datos, no toca la BD.
if (require.main === module) {
  main()
    .catch((error: unknown) => {
      console.error('Seed de prueba fallido:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
