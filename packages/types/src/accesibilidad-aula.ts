import type { AccessibilityPreference, InstructionMode } from './accesibilidad-clase';
import type { Classroom, CommunicationPreference } from './index';

/**
 * ¿Esta aula coincide con la preferencia de comunicación del estudiante?
 * (HU-211, `ARQUITECTURA.md` §4.9, decisión D21.)
 *
 * Es la ÚNICA fuente de esta comparación: la usa el frontend para pintar la
 * marca «Coincide con tu preferencia» en el catálogo y el detalle. Vive aquí,
 * junto a `derivarEstadoAula()`, y no reimplementada en cada pantalla — el
 * emparejamiento es directo (`modosDelAula.includes(preferencia)`) a propósito,
 * para que `CommunicationPreference` sirva igual para el estudiante y el aula.
 *
 * Sin preferencia declarada no hay coincidencia posible: no es un `false`
 * negativo sobre el aula, es que la pregunta no tiene sentido sin el otro dato
 * (AC6, la pantalla no marca nada).
 */
export function coincideConLaPreferencia(
  aula: Pick<Classroom, 'communicationModes'>,
  preferencia: CommunicationPreference | null | undefined,
): boolean {
  if (!preferencia) return false;
  return aula.communicationModes.includes(preferencia);
}

/**
 * ¿Esta aula coincide con la preferencia de instrucción del estudiante? (T5,
 * D42, D44.) Reemplaza a `coincideConLaPreferencia()` contra el modelo nuevo:
 * la comparación es exacta y no "incluye" — `LSC_NATIVA` e `INTERPRETE_LSC`
 * son experiencias distintas, no una escala donde una sirva para la otra.
 *
 * Sin instrucción declarada en ninguno de los dos lados no hay coincidencia
 * posible, igual que en `coincideConLaPreferencia()`.
 */
export function coincideConLaAccesibilidad(
  aula: { instructionMode: InstructionMode | null | undefined },
  preferencia: AccessibilityPreference | null | undefined,
): boolean {
  if (!preferencia?.instructionMode || !aula.instructionMode) return false;
  return aula.instructionMode === preferencia.instructionMode;
}
