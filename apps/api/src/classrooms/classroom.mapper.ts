import type { Classroom as PrismaClassroom } from '@prisma/client';
import {
  type Classroom,
  type ClassroomStatus,
  type EnglishLevel,
  type MeetingProvider,
} from '@academia/types';

/**
 * Convierte una entidad `Classroom` de Prisma en la vista pública de
 * @academia/types.
 *
 * Aquí es donde, a propósito, se DESCARTA `meetingLink`. Es el mismo mecanismo
 * que `toPublicUser` usa con `password`, pero por un motivo más fuerte: el
 * valor de la columna está cifrado, así que serializarlo por descuido no
 * filtraría la URL — filtraría el texto cifrado, que es basura para el
 * frontend y una pista para quien la recoja. Un campo que el cliente no puede
 * usar no debe viajar (`ARQUITECTURA.md` §4.1: fuera de la ventana el campo
 * **se omite**).
 *
 * **En esta HU el enlace no viaja nunca**, ni siquiera al profesor que acaba de
 * escribirlo: ya lo tiene, lo tecleó él. La regla de "quién puede verlo" —el
 * dueño siempre; un estudiante con reserva `CONFIRMED` dentro de los 30 minutos
 * previos— la implementa HU-204 y la completa HU-303, en un único método del
 * servicio. Cuando llegue, la forma de revelarlo es añadir la clave a lo que
 * devuelve esta función, nunca dejar de llamarla.
 *
 * Los enums de Prisma y los de @academia/types comparten los mismos valores
 * string, de ahí los casts.
 */
export function toPublicClassroom(classroom: PrismaClassroom): Classroom {
  return {
    id: classroom.id,
    teacherId: classroom.teacherId,
    title: classroom.title,
    description: classroom.description,
    level: classroom.level as EnglishLevel,
    maxStudents: classroom.maxStudents,
    currentBookings: classroom.currentBookings,
    // ISO 8601 en UTC: el frontend formatea a la zona del usuario y siempre la
    // nombra (§4.7). La cadena que sale de aquí termina en `Z`, sin excepción.
    scheduledAt: classroom.scheduledAt.toISOString(),
    durationMinutes: classroom.durationMinutes,
    meetingProvider: classroom.meetingProvider as MeetingProvider,
    status: classroom.status as ClassroomStatus,
    isRecurring: classroom.isRecurring,
    createdAt: classroom.createdAt.toISOString(),
    updatedAt: classroom.updatedAt.toISOString(),
  };
}
