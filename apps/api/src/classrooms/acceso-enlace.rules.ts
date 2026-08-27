import { ClassroomStatus, type EstadoAccesoEnlace } from '@academia/types';

/** El aula, reducida a lo que esta regla necesita mirar. */
export type AulaParaAcceso = {
  status: string;
  scheduledAt: Date;
  durationMinutes: number;
};

export type ContextoAcceso = {
  /** `true` si quien pregunta es el profesor dueño del aula. */
  esDueno: boolean;
  /** `true` si quien pregunta tiene una reserva `CONFIRMED` en esta aula. */
  tieneReservaConfirmada: boolean;
  ahora: Date;
  accessWindowMinutes: number;
};

export type ResultadoAccesoEnlace = {
  estado: EstadoAccesoEnlace;
  /** El instante en que se abre la ventana. Solo cuando `estado` es `aun-no`. */
  abreEn: Date | null;
};

/**
 * La regla completa de §4.1, como función pura. Es el ÚNICO sitio donde se
 * decide si el enlace es visible y cuándo se abre la ventana: la usan
 * `ClassroomsService.revelarElEnlace()` (para decidir si descifra el enlace) y
 * `BookingsService.listMisReservas()` (para pintar la cuenta atrás), así que
 * las dos pantallas no pueden decir cosas distintas sobre la misma reserva.
 *
 * Un aula `CANCELLED` no revela su enlace a nadie, ni al dueño (D25). El
 * profesor dueño lo ve siempre que el aula no esté cancelada, sin límite de
 * tiempo. Un estudiante solo dentro de `[scheduledAt − accessWindowMinutes,
 * scheduledAt + durationMinutes)`.
 */
export function derivarAccesoAlEnlace(
  aula: AulaParaAcceso,
  contexto: ContextoAcceso,
): ResultadoAccesoEnlace {
  if (aula.status === ClassroomStatus.CANCELLED) {
    return { estado: 'sin-acceso', abreEn: null };
  }

  if (contexto.esDueno) {
    return { estado: 'abierto', abreEn: null };
  }

  if (!contexto.tieneReservaConfirmada) {
    return { estado: 'sin-acceso', abreEn: null };
  }

  const apertura = new Date(aula.scheduledAt.getTime() - contexto.accessWindowMinutes * 60_000);
  const cierre = new Date(aula.scheduledAt.getTime() + aula.durationMinutes * 60_000);
  const ahoraMs = contexto.ahora.getTime();

  if (ahoraMs >= cierre.getTime()) {
    return { estado: 'sin-acceso', abreEn: null };
  }

  if (ahoraMs >= apertura.getTime()) {
    return { estado: 'abierto', abreEn: null };
  }

  return { estado: 'aun-no', abreEn: apertura };
}
