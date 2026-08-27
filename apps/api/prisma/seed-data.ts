/**
 * Datos puros del seed (HU-307): sin Prisma, sin `Date.now()`, para poder
 * testear las invariantes de negocio sin tocar la base de datos.
 */
import type {
  BookingStatus,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  UserRole,
  UserStatus,
} from '@prisma/client';

export type UsuarioDePrueba = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  communicationPreference?: CommunicationPreference;
};

/**
 * Dos profesores `ACTIVE`, uno `PENDING`, y seis estudiantes `ACTIVE`.
 *
 * `alumno` y `alumno2` (T1) llevan preferencias de comunicación distintas
 * para que HU-305 tenga algo que resumir. `alumno3`–`alumno6` son relleno:
 * existen solo para que `currentBookings` de cada aula cuadre con reservas
 * reales (T6) sin que el estudiante del seed acumule solapes de horario.
 */
export const USUARIOS_DE_PRUEBA: UsuarioDePrueba[] = [
  {
    email: 'profe@academia.local',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: 'TEACHER',
    status: 'ACTIVE',
  },
  {
    email: 'profe2@academia.local',
    firstName: 'Diana',
    lastName: 'Docente',
    role: 'TEACHER',
    status: 'ACTIVE',
  },
  {
    email: 'profe.pendiente@academia.local',
    firstName: 'Pedro',
    lastName: 'Pendiente',
    role: 'TEACHER',
    status: 'PENDING',
  },
  {
    email: 'alumno@academia.local',
    firstName: 'Aitor',
    lastName: 'Alumno',
    role: 'STUDENT',
    status: 'ACTIVE',
    communicationPreference: 'SIGN_LANGUAGE',
  },
  {
    email: 'alumno2@academia.local',
    firstName: 'Sara',
    lastName: 'Estudiante',
    role: 'STUDENT',
    status: 'ACTIVE',
    communicationPreference: 'WRITTEN_TEXT',
  },
  {
    email: 'alumno3@academia.local',
    firstName: 'Marco',
    lastName: 'Martín',
    role: 'STUDENT',
    status: 'ACTIVE',
    communicationPreference: 'SIGN_LANGUAGE',
  },
  {
    email: 'alumno4@academia.local',
    firstName: 'Nadia',
    lastName: 'Núñez',
    role: 'STUDENT',
    status: 'ACTIVE',
  },
  {
    email: 'alumno5@academia.local',
    firstName: 'Iker',
    lastName: 'Ibáñez',
    role: 'STUDENT',
    status: 'ACTIVE',
  },
  {
    email: 'alumno6@academia.local',
    firstName: 'Teo',
    lastName: 'Torres',
    role: 'STUDENT',
    status: 'ACTIVE',
  },
];

export type AulaDeDemostracion = {
  /** Id fijo: es lo que hace idempotente el `upsert` de una fila sin campo único de negocio. */
  id: string;
  teacherEmail: string;
  title: string;
  description: string;
  level: EnglishLevel;
  maxStudents: number;
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

export const AULA_DISPONIBLE = '00000000-0000-4000-8000-000000000001';
export const AULA_ULTIMO_CUPO = '00000000-0000-4000-8000-000000000002';
export const AULA_LLENA = '00000000-0000-4000-8000-000000000003';
export const AULA_EN_CURSO = '00000000-0000-4000-8000-000000000004';
export const AULA_FINALIZADA = '00000000-0000-4000-8000-000000000005';
export const AULA_CANCELADA = '00000000-0000-4000-8000-000000000006';
export const AULA_SIN_MODOS = '00000000-0000-4000-8000-000000000007';
export const AULA_BASICA = '00000000-0000-4000-8000-000000000008';
export const AULA_A_PUNTO_DE_EMPEZAR = '00000000-0000-4000-8000-000000000009';

/**
 * Nueve aulas repartidas entre los dos profesores activos, con fechas
 * relativas a `now()`. `currentBookings` NO vive aquí: se calcula siempre a
 * partir de `RESERVAS_DE_DEMOSTRACION` (T6), así que no hay dos sitios que
 * puedan descuadrarse entre sí.
 */
export const AULAS_DE_DEMOSTRACION: AulaDeDemostracion[] = [
  {
    id: AULA_DISPONIBLE,
    teacherEmail: 'profe@academia.local',
    title: 'Inglés conversacional — nivel principiante',
    description: 'Práctica de conversación cotidiana, ritmo tranquilo, en lengua de señas.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledInMinutes: 3 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-disponible',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE'],
    hasInterpreter: true,
  },
  {
    id: AULA_ULTIMO_CUPO,
    teacherEmail: 'profe@academia.local',
    title: 'Inglés para el trabajo — intermedio',
    description: 'Vocabulario y frases para reuniones y correos en inglés.',
    level: 'INTERMEDIATE',
    maxStudents: 5, // 4 reservas CONFIRMED: último cupo libre (T4/AC3).
    scheduledInMinutes: 2 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-ultimos-cupos',
    meetingProvider: 'ZOOM',
    communicationModes: ['WRITTEN_TEXT', 'LIP_READING'],
    hasLiveCaptions: true,
  },
  {
    id: AULA_LLENA,
    teacherEmail: 'profe2@academia.local',
    title: 'Conversación avanzada — grupo reducido',
    description: 'Debate en inglés sobre actualidad, grupo pequeño para practicar sin prisa.',
    level: 'ADVANCED',
    maxStudents: 4, // 4 reservas CONFIRMED: llena (T4/AC3).
    scheduledInMinutes: 24 * 60,
    durationMinutes: 90,
    meetingLink: 'https://zoom.us/j/demo-llena',
    meetingProvider: 'ZOOM',
    communicationModes: ['SPOKEN_AUDIO'],
  },
  {
    id: AULA_EN_CURSO,
    teacherEmail: 'profe2@academia.local',
    title: 'Inglés en curso ahora mismo (demo)',
    description: 'Aula sembrada ya empezada, para enseñar el estado «en curso».',
    level: 'INTERMEDIATE',
    maxStudents: 6,
    scheduledInMinutes: -15,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-en-curso',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE', 'LIP_READING'],
    hasLiveCaptions: true,
  },
  {
    id: AULA_FINALIZADA,
    teacherEmail: 'profe@academia.local',
    title: 'Clase finalizada (demo histórico)',
    description: 'Aula sembrada ya terminada, para enseñar el historial de «Mis aulas».',
    level: 'BEGINNER',
    maxStudents: 6,
    scheduledInMinutes: -2 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-finalizada',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['WRITTEN_TEXT'],
  },
  {
    id: AULA_CANCELADA,
    teacherEmail: 'profe2@academia.local',
    title: 'Clase cancelada (demo)',
    description: 'Aula sembrada ya cancelada, para enseñar el estado «cancelada».',
    level: 'ADVANCED',
    maxStudents: 5,
    scheduledInMinutes: 5 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://zoom.us/j/demo-cancelada',
    meetingProvider: 'ZOOM',
    communicationModes: ['SIGN_LANGUAGE'],
    status: 'CANCELLED',
  },
  {
    id: AULA_SIN_MODOS,
    teacherEmail: 'profe@academia.local',
    title: 'Inglés general — modos sin indicar',
    description: 'Aula sembrada de antes de HU-211, sin modos de comunicación declarados.',
    level: 'INTERMEDIATE',
    maxStudents: 10,
    scheduledInMinutes: 4 * 24 * 60,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-sin-modos',
    meetingProvider: 'MANUAL',
    communicationModes: [],
  },
  {
    id: AULA_BASICA,
    teacherEmail: 'profe2@academia.local',
    title: 'Inglés básico — audio y texto',
    description: 'Clase introductoria con subtítulos y materiales visuales de apoyo.',
    level: 'BEGINNER',
    maxStudents: 8,
    scheduledInMinutes: 6 * 24 * 60,
    durationMinutes: 45,
    meetingLink: 'https://zoom.us/j/demo-basico',
    meetingProvider: 'ZOOM',
    communicationModes: ['SPOKEN_AUDIO', 'WRITTEN_TEXT'],
    hasVisualMaterials: true,
  },
  {
    id: AULA_A_PUNTO_DE_EMPEZAR,
    teacherEmail: 'profe@academia.local',
    title: 'Clase a punto de empezar (demo)',
    description: 'Empieza en minutos: el enlace ya es visible para quien tiene reserva.',
    level: 'INTERMEDIATE',
    maxStudents: 6,
    scheduledInMinutes: 10,
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/demo-a-punto-de-empezar',
    meetingProvider: 'GOOGLE_MEET',
    communicationModes: ['SIGN_LANGUAGE'],
    hasInterpreter: true,
  },
];

export type ReservaDeDemostracion = {
  /** Id fijo: `Booking` no tiene una clave de negocio total que sirva de `upsert` (§3, unique parcial). */
  id: string;
  studentEmail: string;
  classroomId: string;
  status: BookingStatus;
  /** Solo para `CANCELLED`. Minutos desde `now()`, igual que `scheduledInMinutes`. */
  cancelledAtInMinutes?: number;
};

/**
 * Reservas del seed (T2, T3, T4, T5, T6). `alumno` es quien enseña «Mis
 * reservas»: una próxima, una a punto de empezar (dentro de la ventana de
 * acceso) y una pasada, más la cancelada de T3. El resto son relleno para que
 * `currentBookings` de cada aula cuadre con reservas reales.
 */
export const RESERVAS_DE_DEMOSTRACION: ReservaDeDemostracion[] = [
  {
    id: '00000000-0000-4000-9000-000000000001',
    studentEmail: 'alumno@academia.local',
    classroomId: AULA_DISPONIBLE,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000002',
    studentEmail: 'alumno@academia.local',
    classroomId: AULA_A_PUNTO_DE_EMPEZAR,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000003',
    studentEmail: 'alumno@academia.local',
    classroomId: AULA_FINALIZADA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000004',
    studentEmail: 'alumno@academia.local',
    classroomId: AULA_SIN_MODOS,
    status: 'CANCELLED',
    cancelledAtInMinutes: -2 * 24 * 60,
  },
  {
    id: '00000000-0000-4000-9000-000000000005',
    studentEmail: 'alumno2@academia.local',
    classroomId: AULA_ULTIMO_CUPO,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000006',
    studentEmail: 'alumno3@academia.local',
    classroomId: AULA_DISPONIBLE,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000007',
    studentEmail: 'alumno4@academia.local',
    classroomId: AULA_DISPONIBLE,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000008',
    studentEmail: 'alumno3@academia.local',
    classroomId: AULA_ULTIMO_CUPO,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000009',
    studentEmail: 'alumno4@academia.local',
    classroomId: AULA_ULTIMO_CUPO,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000010',
    studentEmail: 'alumno5@academia.local',
    classroomId: AULA_ULTIMO_CUPO,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000011',
    studentEmail: 'alumno3@academia.local',
    classroomId: AULA_LLENA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000012',
    studentEmail: 'alumno4@academia.local',
    classroomId: AULA_LLENA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000013',
    studentEmail: 'alumno5@academia.local',
    classroomId: AULA_LLENA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000014',
    studentEmail: 'alumno6@academia.local',
    classroomId: AULA_LLENA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000015',
    studentEmail: 'alumno4@academia.local',
    classroomId: AULA_EN_CURSO,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000016',
    studentEmail: 'alumno5@academia.local',
    classroomId: AULA_EN_CURSO,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000017',
    studentEmail: 'alumno3@academia.local',
    classroomId: AULA_FINALIZADA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000018',
    studentEmail: 'alumno5@academia.local',
    classroomId: AULA_FINALIZADA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000019',
    studentEmail: 'alumno6@academia.local',
    classroomId: AULA_FINALIZADA,
    status: 'CONFIRMED',
  },
  {
    id: '00000000-0000-4000-9000-000000000020',
    studentEmail: 'alumno3@academia.local',
    classroomId: AULA_SIN_MODOS,
    status: 'CONFIRMED',
  },
];

/** Cuenta reservas `CONFIRMED` por aula. Es lo único que decide `currentBookings` (T6). */
export function contarConfirmadasPorAula(
  reservas: Pick<ReservaDeDemostracion, 'classroomId' | 'status'>[],
): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const reserva of reservas) {
    if (reserva.status !== 'CONFIRMED') continue;
    conteo.set(reserva.classroomId, (conteo.get(reserva.classroomId) ?? 0) + 1);
  }
  return conteo;
}
