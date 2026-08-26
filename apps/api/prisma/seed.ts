/**
 * Seed de la base de datos.
 *
 *  - SIEMPRE crea el usuario Admin del sistema, con credenciales tomadas de
 *    variables de entorno (ADMIN_EMAIL / ADMIN_PASSWORD). Así el MISMO seed
 *    sirve en desarrollo y en producción sin hornear credenciales en el repo.
 *  - En entornos NO productivos, además crea usuarios de prueba (dos
 *    profesores activos, uno pendiente, y un estudiante) y aulas de
 *    demostración que cubren los estados que el Sprint 2 necesita enseñar.
 *
 * Idempotente: `upsert` por email (usuarios) o por un id fijo (aulas), así
 * que se puede re-ejecutar sin duplicar. Las fechas de las aulas son
 * SIEMPRE relativas a `now()`: un seed con fechas absolutas caduca.
 *
 * Ejecución: npm run db:seed --workspace @academia/api
 */
import {
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

import { BCRYPT_SALT_ROUNDS } from '../src/auth/auth.constants';
import type { AppConfigService } from '../src/config/app-config.service';
import { MeetingLinkCipher } from '../src/classrooms/meeting-link.cipher';

const prisma = new PrismaClient();

/** Lee una variable obligatoria del entorno o aborta con un mensaje claro. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${name}. Es obligatoria para sembrar el Admin ` +
        `(ver apps/api/.env.example).`,
    );
  }
  return value;
}

/** Crea (o respeta si ya existe) el Admin del sistema desde el entorno. */
async function seedAdmin(): Promise<void> {
  const email = requireEnv('ADMIN_EMAIL').toLowerCase().trim();
  const password = requireEnv('ADMIN_PASSWORD');
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Sistema';

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {}, // nunca pisamos un admin existente.
    create: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`  ✔ ADMIN   ${email}`);
}

type UsuarioDePrueba = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  communicationPreference?: CommunicationPreference;
};

/**
 * Usuarios de prueba, solo para desarrollo. Dos profesores `ACTIVE` (T1: sin
 * dos, no se puede enseñar ni la supervisión del admin ni el distintivo «Tu
 * clase») y uno `PENDING` (T2: algo que aprobar en el panel del admin).
 *
 * El estudiante lleva `communicationPreference` fijada para que el catálogo
 * pueda marcar «Coincide con tu preferencia» en algunas aulas y no en otras
 * (T5).
 */
const USUARIOS_DE_PRUEBA: UsuarioDePrueba[] = [
  {
    email: 'profe@academia.local',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'profe2@academia.local',
    firstName: 'Diana',
    lastName: 'Docente',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'profe.pendiente@academia.local',
    firstName: 'Pedro',
    lastName: 'Pendiente',
    role: UserRole.TEACHER,
    status: UserStatus.PENDING,
  },
  {
    email: 'alumno@academia.local',
    firstName: 'Aitor',
    lastName: 'Alumno',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    communicationPreference: CommunicationPreference.SIGN_LANGUAGE,
  },
];

async function seedTestUsers(): Promise<void> {
  const password = process.env.SEED_TEST_PASSWORD?.trim() || 'Password123!';
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  for (const user of USUARIOS_DE_PRUEBA) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password: passwordHash },
    });
    console.log(`  ✔ ${user.role.padEnd(7)} ${user.email}  (contraseña: ${password})`);
  }
}

/** Minutos desde ahora, positivos o negativos, como fecha absoluta. */
function minutosDesdeAhora(minutos: number): Date {
  return new Date(Date.now() + minutos * 60_000);
}

type AulaDeDemostracion = {
  /** Id fijo: es lo que hace idempotente el `upsert` de una fila sin campo único de negocio. */
  id: string;
  teacherEmail: string;
  title: string;
  description: string;
  level: EnglishLevel;
  maxStudents: number;
  currentBookings: number;
  scheduledInMinutes: number;
  durationMinutes: number;
  meetingLink: string;
  meetingProvider: MeetingProvider;
  communicationModes: CommunicationPreference[];
  status?: ClassroomStatus;
  hasInterpreter?: boolean;
  hasLiveCaptions?: boolean;
  hasVisualMaterials?: boolean;
};

/**
 * Ocho aulas (T3) repartidas entre los dos profesores activos, con fechas
 * relativas a `now()`. Cubren seis de los nueve estados de `<EstadoAula>`
 * alcanzables sin `Booking` (que no existe hasta el Sprint 3): `disponible`,
 * `ultimos-cupos`, `llena`, `en-curso`, `finalizada` y `cancelada`. Los otros
 * tres (`reservada`, `acceso-abierto`, `pendiente-aprobacion`) no tienen
 * ningún caso alcanzable hoy (ver la nota de `derivarEstadoAula`).
 */
const AULAS_DE_DEMOSTRACION: AulaDeDemostracion[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    teacherEmail: 'profe@academia.local',
    title: 'Inglés conversacional — nivel principiante',
    description: 'Práctica de conversación cotidiana, ritmo tranquilo, en lengua de señas.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 2,
    scheduledInMinutes: 3 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-disponible',
    meetingProvider: MeetingProvider.GOOGLE_MEET,
    communicationModes: [CommunicationPreference.SIGN_LANGUAGE],
    hasInterpreter: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    teacherEmail: 'profe@academia.local',
    title: 'Inglés para el trabajo — intermedio',
    description: 'Vocabulario y frases para reuniones y correos en inglés.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 5,
    currentBookings: 3, // quedan 2 cupos: ultimos-cupos.
    scheduledInMinutes: 2 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-ultimos-cupos',
    meetingProvider: MeetingProvider.ZOOM,
    communicationModes: [CommunicationPreference.WRITTEN_TEXT, CommunicationPreference.LIP_READING],
    hasLiveCaptions: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    teacherEmail: 'profe2@academia.local',
    title: 'Conversación avanzada — grupo reducido',
    description: 'Debate en inglés sobre actualidad, grupo pequeño para practicar sin prisa.',
    level: EnglishLevel.ADVANCED,
    maxStudents: 4,
    currentBookings: 4, // cupo lleno: llena / sin cupos.
    scheduledInMinutes: 24 * 60,
    durationMinutes: 90,
    meetingLink: 'https://zoom.us/j/demo-llena',
    meetingProvider: MeetingProvider.ZOOM,
    communicationModes: [CommunicationPreference.SPOKEN_AUDIO],
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    teacherEmail: 'profe2@academia.local',
    title: 'Inglés en curso ahora mismo (demo)',
    description: 'Aula sembrada ya empezada, para enseñar el estado «en curso».',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 6,
    currentBookings: 2,
    scheduledInMinutes: -15,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-en-curso',
    meetingProvider: MeetingProvider.GOOGLE_MEET,
    communicationModes: [
      CommunicationPreference.SIGN_LANGUAGE,
      CommunicationPreference.LIP_READING,
    ],
    hasLiveCaptions: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    teacherEmail: 'profe@academia.local',
    title: 'Clase finalizada (demo histórico)',
    description: 'Aula sembrada ya terminada, para enseñar el historial de «Mis aulas».',
    level: EnglishLevel.BEGINNER,
    maxStudents: 6,
    currentBookings: 4,
    scheduledInMinutes: -2 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-finalizada',
    meetingProvider: MeetingProvider.GOOGLE_MEET,
    communicationModes: [CommunicationPreference.WRITTEN_TEXT],
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    teacherEmail: 'profe2@academia.local',
    title: 'Clase cancelada (demo)',
    description: 'Aula sembrada ya cancelada, para enseñar el estado «cancelada».',
    level: EnglishLevel.ADVANCED,
    maxStudents: 5,
    currentBookings: 0,
    scheduledInMinutes: 5 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-cancelada',
    meetingProvider: MeetingProvider.ZOOM,
    communicationModes: [CommunicationPreference.SIGN_LANGUAGE],
    status: ClassroomStatus.CANCELLED,
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    teacherEmail: 'profe@academia.local',
    title: 'Inglés general — modos sin indicar',
    description: 'Aula sembrada de antes de HU-211, sin modos de comunicación declarados.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 1,
    scheduledInMinutes: 4 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-sin-modos',
    meetingProvider: MeetingProvider.MANUAL,
    communicationModes: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    teacherEmail: 'profe2@academia.local',
    title: 'Inglés básico — audio y texto',
    description: 'Clase introductoria con subtítulos y materiales visuales de apoyo.',
    level: EnglishLevel.BEGINNER,
    maxStudents: 8,
    currentBookings: 0,
    scheduledInMinutes: 6 * 24 * 60,
    durationMinutes: 45,
    meetingLink: 'https://zoom.us/j/demo-basico',
    meetingProvider: MeetingProvider.ZOOM,
    communicationModes: [
      CommunicationPreference.SPOKEN_AUDIO,
      CommunicationPreference.WRITTEN_TEXT,
    ],
    hasVisualMaterials: true,
  },
];

/** Aulas de ejemplo (T3–T6), a nombre de los profesores `ACTIVE` sembrados arriba. */
async function seedClassrooms(): Promise<void> {
  const meetingLinks = new MeetingLinkCipher({
    meetingLinkKey: requireEnv('MEETING_LINK_KEY'),
  } as AppConfigService);

  const teachers = await prisma.user.findMany({
    where: { email: { in: ['profe@academia.local', 'profe2@academia.local'] } },
    select: { id: true, email: true },
  });
  const teacherIdByEmail = new Map(teachers.map((t) => [t.email, t.id]));

  for (const aula of AULAS_DE_DEMOSTRACION) {
    const teacherId = teacherIdByEmail.get(aula.teacherEmail);
    if (!teacherId) {
      throw new Error(`Seed de aulas: no existe el profesor ${aula.teacherEmail}.`);
    }

    const data = {
      teacherId,
      title: aula.title,
      description: aula.description,
      level: aula.level,
      maxStudents: aula.maxStudents,
      currentBookings: aula.currentBookings,
      scheduledAt: minutosDesdeAhora(aula.scheduledInMinutes),
      durationMinutes: aula.durationMinutes,
      meetingLink: meetingLinks.encrypt(aula.meetingLink),
      meetingProvider: aula.meetingProvider,
      status: aula.status ?? ClassroomStatus.PUBLISHED,
      communicationModes: aula.communicationModes,
      hasInterpreter: aula.hasInterpreter ?? false,
      hasLiveCaptions: aula.hasLiveCaptions ?? false,
      hasVisualMaterials: aula.hasVisualMaterials ?? false,
    };

    await prisma.classroom.upsert({
      where: { id: aula.id },
      update: data,
      create: { id: aula.id, ...data },
    });
    console.log(`  ✔ AULA    ${aula.title}`);
  }
}

async function main(): Promise<void> {
  await seedAdmin();

  // En producción NO se siembran usuarios ni aulas de prueba.
  if (process.env.NODE_ENV !== 'production') {
    await seedTestUsers();
    await seedClassrooms();
  }

  const [totalUsuarios, totalAulas] = await Promise.all([
    prisma.user.count(),
    prisma.classroom.count(),
  ]);
  console.log(`Seed completado. Usuarios en la BD: ${totalUsuarios}. Aulas: ${totalAulas}.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed fallido:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
