import { CommunicationPreference, EnglishLevel } from '@academia/types';

/**
 * Aulas de ejemplo para la demostración del catálogo en la landing. No salen de
 * la API: son fijas y sirven para que quien llega pruebe los filtros con la
 * misma forma de tarjeta que verá dentro. Las fechas van completas y con zona,
 * como exige el microcopy.
 */
export type AulaDemo = {
  id: number;
  fecha: string;
  titulo: string;
  profesor: string;
  nivel: EnglishLevel;
  modos: CommunicationPreference[];
  maxStudents: number;
  currentBookings: number;
};

export const AULAS_DEMO: AulaDemo[] = [
  {
    id: 1,
    fecha: 'Martes 12 de agosto de 2026, 6:00 p. m. (hora de Colombia)',
    titulo: 'Conversación: pedir indicaciones',
    profesor: 'Lucía Herrera',
    nivel: EnglishLevel.INTERMEDIATE,
    modos: [CommunicationPreference.SIGN_LANGUAGE, CommunicationPreference.WRITTEN_TEXT],
    maxStudents: 12,
    currentBookings: 9,
  },
  {
    id: 2,
    fecha: 'Martes 12 de agosto de 2026, 8:00 p. m. (hora de Colombia)',
    titulo: 'Saludos y presentarse',
    profesor: 'Andrés Quintero',
    nivel: EnglishLevel.BEGINNER,
    modos: [CommunicationPreference.SIGN_LANGUAGE, CommunicationPreference.LIP_READING],
    maxStudents: 10,
    currentBookings: 4,
  },
  {
    id: 3,
    fecha: 'Miércoles 13 de agosto de 2026, 7:00 p. m. (hora de Colombia)',
    titulo: 'Inglés para entrevistas de trabajo',
    profesor: 'Camila Ruiz',
    nivel: EnglishLevel.ADVANCED,
    modos: [CommunicationPreference.WRITTEN_TEXT],
    maxStudents: 8,
    currentBookings: 8,
  },
  {
    id: 4,
    fecha: 'Jueves 14 de agosto de 2026, 6:00 p. m. (hora de Colombia)',
    titulo: 'Vocabulario del día a día',
    profesor: 'Lucía Herrera',
    nivel: EnglishLevel.BEGINNER,
    modos: [
      CommunicationPreference.SIGN_LANGUAGE,
      CommunicationPreference.WRITTEN_TEXT,
      CommunicationPreference.SPOKEN_AUDIO,
    ],
    maxStudents: 12,
    currentBookings: 2,
  },
  {
    id: 5,
    fecha: 'Jueves 14 de agosto de 2026, 8:30 p. m. (hora de Colombia)',
    titulo: 'Leer noticias en inglés',
    profesor: 'Daniel Otero',
    nivel: EnglishLevel.INTERMEDIATE,
    modos: [CommunicationPreference.WRITTEN_TEXT, CommunicationPreference.LIP_READING],
    maxStudents: 15,
    currentBookings: 13,
  },
  {
    id: 6,
    fecha: 'Sábado 16 de agosto de 2026, 10:00 a. m. (hora de Colombia)',
    titulo: 'Conversación libre con intérprete',
    profesor: 'Camila Ruiz',
    nivel: EnglishLevel.INTERMEDIATE,
    modos: [CommunicationPreference.SIGN_LANGUAGE],
    maxStudents: 10,
    currentBookings: 6,
  },
];
