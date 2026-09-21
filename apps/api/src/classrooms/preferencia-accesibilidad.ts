import {
  type AccessibilityPreference,
  type CommunicationPreference,
  MIGRACION_PREFERENCIA_COMUNICACION,
} from '@academia/types';

/**
 * La preferencia vieja de un estudiante (`User.communicationPreference`),
 * migrada al vocabulario de D42 con el mapeo de HU-505 (HU-506, T2). No hay
 * columna nueva que migrar: el valor sigue viviendo donde siempre, esto solo
 * lo traduce al leerlo.
 */
export function preferenciaAccesibilidadDe(
  preferencia: CommunicationPreference | null,
): AccessibilityPreference {
  return preferencia
    ? MIGRACION_PREFERENCIA_COMUNICACION[preferencia]
    : { instructionMode: null, supports: [] };
}
