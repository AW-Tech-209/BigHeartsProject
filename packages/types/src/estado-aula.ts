import type { Classroom } from './index';
import { ClassroomStatus, UserStatus } from './index';

/**
 * Los nueve estados visibles de un aula (`patrones-dominio.md` del skill
 * `bighearts-ui`). Ninguno es una columna de la base de datos: todos se
 * DERIVAN de `Classroom.status`, el contador de cupos, la hora actual y la
 * reserva del propio usuario (`ARQUITECTURA.md` §7.3).
 */
export type EstadoAula =
  | 'pendiente-aprobacion'
  | 'cancelada'
  | 'finalizada'
  | 'en-curso'
  | 'acceso-abierto'
  | 'reservada'
  | 'llena'
  | 'ultimos-cupos'
  | 'disponible';

/**
 * Con 3 cupos o menos libres, el aula pasa de `disponible` a `ultimos-cupos`.
 * Propuesta de la HU-203, sin decidir en ningún otro sitio (ver auditoría del
 * 2026-08-18 en `docs/historias/HU-203-listado-de-aulas.md`).
 */
export const UMBRAL_ULTIMOS_CUPOS = 3;

/**
 * Minutos antes de `scheduledAt` en los que se abre el acceso al enlace.
 * `contrato-api.md` ya fija el valor en 30; el env var `ACCESS_WINDOW_MINUTES`
 * que lo hará configurable de verdad lo introduce HU-303. Hasta entonces esta
 * constante es el default, y el parámetro de `derivarEstadoAula` existe para
 * que HU-303 no tenga que tocar la firma de la función, solo dejar de usar el
 * default.
 */
export const ACCESS_WINDOW_MINUTES_DEFAULT = 30;

export type ParametrosDerivarEstadoAula = {
  classroom: Pick<
    Classroom,
    'status' | 'currentBookings' | 'maxStudents' | 'scheduledAt' | 'durationMinutes'
  >;
  /** El reloj contra el que se derivan `en-curso`, `finalizada` y `acceso-abierto`. */
  ahora: Date;
  /**
   * `true` si quien mira tiene una reserva `CONFIRMED` en esta aula.
   *
   * En Sprint 2 el catálogo (`GET /classrooms`) no incluye datos de reserva
   * propia —el módulo de `bookings` todavía no existe—, así que el frontend
   * llama a esta función siempre con `undefined` aquí. El parámetro ya está
   * porque HU-301 lo completa sin tener que cambiar la firma.
   */
  tieneReservaConfirmada?: boolean;
  /**
   * El estado de cuenta del profesor, **solo cuando quien mira es el dueño
   * del aula**. Igual que `tieneReservaConfirmada`, en Sprint 2 siempre llega
   * `undefined`: "Mis aulas" (la única pantalla que podría poblarlo) es una HU
   * aparte, fuera de alcance de HU-203.
   */
  estadoDelProfesorQueMira?: UserStatus;
  accessWindowMinutes?: number;
};

/**
 * Deriva el estado visible de un aula a partir de sus campos crudos.
 *
 * Es la ÚNICA fuente de esta lógica: la usan el backend al serializar (si
 * algún día necesita el estado) y el frontend al pintar, así que las dos
 * capas no pueden decir cosas distintas sobre la misma aula
 * (`ARQUITECTURA.md` §7.3). **Se evalúa en orden — el primer match gana** —
 * y ese orden es la especificación, no un detalle de implementación: por
 * ejemplo, un aula `CANCELLED` con una reserva `CONFIRMED` propia da
 * `cancelada`, no `reservada`.
 */
export function derivarEstadoAula({
  classroom,
  ahora,
  tieneReservaConfirmada,
  estadoDelProfesorQueMira,
  accessWindowMinutes = ACCESS_WINDOW_MINUTES_DEFAULT,
}: ParametrosDerivarEstadoAula): EstadoAula {
  if (estadoDelProfesorQueMira === UserStatus.PENDING) {
    return 'pendiente-aprobacion';
  }

  if (classroom.status === ClassroomStatus.CANCELLED) {
    return 'cancelada';
  }

  const inicio = new Date(classroom.scheduledAt).getTime();
  const fin = inicio + classroom.durationMinutes * 60_000;
  const ahoraMs = ahora.getTime();

  if (classroom.status === ClassroomStatus.COMPLETED || ahoraMs >= fin) {
    return 'finalizada';
  }

  if (ahoraMs >= inicio && ahoraMs < fin) {
    return 'en-curso';
  }

  const aperturaAcceso = inicio - accessWindowMinutes * 60_000;
  if (tieneReservaConfirmada && ahoraMs >= aperturaAcceso) {
    return 'acceso-abierto';
  }

  if (tieneReservaConfirmada) {
    return 'reservada';
  }

  if (classroom.currentBookings >= classroom.maxStudents) {
    return 'llena';
  }

  if (classroom.maxStudents - classroom.currentBookings <= UMBRAL_ULTIMOS_CUPOS) {
    return 'ultimos-cupos';
  }

  return 'disponible';
}
