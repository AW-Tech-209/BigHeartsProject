import type {
  ClassroomDurationInvalidDetails,
  ClassroomLeadTimeWarningDetails,
  TeacherScheduleConflictDetails,
} from '@academia/types';

import { describirRangoHorario } from './horario';

/**
 * Lectura del `details` de los tres errores de coherencia temporal (HU-212) y
 * el texto que sale de ellos.
 *
 * **Nada de esto parsea el `message` del servidor.** El frontend ramifica por el
 * `code` (`contrato-api.md` §3) y lo que necesita para escribir la frase viaja
 * en `details`. Aquí solo se comprueba que ese `details` traiga de verdad lo que
 * el contrato promete: `ApiClientError.details` es un `Record<string, unknown>`
 * —lo que llegó por la red, sin garantía de forma—, y un `as` a secas sobre él
 * convertiría un despliegue desincronizado en un `undefined` incrustado en
 * mitad de un mensaje que lee un profesor.
 *
 * Cuando la forma no cuadra, el que llama se queda con el `message` del
 * servidor, que siempre dice algo cierto aunque sea menos útil.
 */

/** `Ya tienes «Conversación cotidiana» el martes 25 de agosto, de 6:00 p. m. a 7:00 p. m.` (AC5). */
export function mensajeDeSolapamiento(detalles: TeacherScheduleConflictDetails): string {
  const cuando = describirRangoHorario(
    detalles.conflictoScheduledAt,
    detalles.conflictoDurationMinutes,
  );

  // Nombrar la clase es el AC5 entero: «hay un conflicto de horario» obliga al
  // profesor a abrir sus aulas y buscar a mano cuál de ellas estorba. La
  // segunda frase dice qué hacer, porque este error no se puede confirmar.
  return `Ya tienes «${detalles.conflictoTitulo}» el ${cuando}. Elige otra hora u otro día.`;
}

export function detallesDeSolapamiento(
  details: Record<string, unknown> | undefined,
): TeacherScheduleConflictDetails | null {
  if (
    esTexto(details?.conflictoId) &&
    esTexto(details?.conflictoTitulo) &&
    esTexto(details?.conflictoScheduledAt) &&
    esNumero(details?.conflictoDurationMinutes)
  ) {
    return details as unknown as TeacherScheduleConflictDetails;
  }

  return null;
}

export function detallesDeDuracion(
  details: Record<string, unknown> | undefined,
): ClassroomDurationInvalidDetails | null {
  return esNumero(details?.maximoMinutos)
    ? (details as unknown as ClassroomDurationInvalidDetails)
    : null;
}

export function detallesDeAntelacion(
  details: Record<string, unknown> | undefined,
): ClassroomLeadTimeWarningDetails | null {
  return esNumero(details?.minutosDeAntelacion) && esNumero(details?.minimoMinutos)
    ? (details as unknown as ClassroomLeadTimeWarningDetails)
    : null;
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0;
}

/** `Number.isFinite` y no `typeof number`: `NaN` llegaría como número y no lo es. */
function esNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}
