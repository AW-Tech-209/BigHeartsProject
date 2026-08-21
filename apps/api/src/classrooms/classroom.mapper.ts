import type { Classroom as PrismaClassroom } from '@prisma/client';
import {
  type BookingStatus,
  type Classroom,
  type ClassroomDetail,
  type ClassroomListItem,
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
 * **Esta función no revela el enlace nunca**, y ninguna de sus variantes de
 * listado lo hace (§4.8, regla 2). El único sitio donde puede aparecer es
 * {@link toClassroomDetail}, que lo recibe ya descifrado de quien tomó la
 * decisión — nunca lo decide por su cuenta.
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

/**
 * La misma vista pública, con el nombre del profesor (HU-203, A3). El
 * catálogo lo necesita para que la tarjeta diga quién da la clase sin una
 * segunda petición por aula.
 */
export function toClassroomListItem(
  classroom: PrismaClassroom,
  teacher: { firstName: string; lastName: string },
): ClassroomListItem {
  return {
    ...toPublicClassroom(classroom),
    teacherFirstName: teacher.firstName,
    teacherLastName: teacher.lastName,
  };
}

/**
 * Lo que el servidor decidió mostrarle a **quien pide**, ya resuelto.
 *
 * Los dos campos son deliberadamente datos y no reglas: el mapeador no sabe
 * quién mira ni qué hora es, y no debe saberlo. Quien decide es
 * `ClassroomsService.revelarElEnlace()`, en un solo sitio (A2).
 */
export type RevelacionesDelDetalle = {
  /**
   * El enlace **ya descifrado**, o `undefined` si a quien pregunta no le
   * corresponde. `undefined` produce una respuesta **sin la clave**, no con la
   * clave en `null`.
   */
  meetingLink?: string;
  /** La reserva propia. `null` en todo el Sprint 2: `Booking` no existe. */
  myBookingStatus: BookingStatus | null;
};

/**
 * El aula completa de `GET /classrooms/:id` (HU-204).
 *
 * Parte de {@link toClassroomListItem} —el detalle enseña lo mismo que la
 * tarjeta y algo más— y le añade lo único que depende de quién pregunta.
 *
 * **`meetingLink` se AÑADE condicionalmente, no se asigna a `undefined`.** La
 * diferencia importa aunque `JSON.stringify` borre las claves `undefined`: con
 * la asignación, la clave existe en el objeto, y cualquier `Object.keys`, log o
 * serializador intermedio que no sea `JSON` la vería. §4.1 pide que el campo
 * **no viaje**, no que viaje vacío.
 */
export function toClassroomDetail(
  classroom: PrismaClassroom,
  teacher: { firstName: string; lastName: string },
  revelaciones: RevelacionesDelDetalle,
): ClassroomDetail {
  return {
    ...toClassroomListItem(classroom, teacher),
    myBookingStatus: revelaciones.myBookingStatus,
    ...(revelaciones.meetingLink !== undefined && { meetingLink: revelaciones.meetingLink }),
  };
}
