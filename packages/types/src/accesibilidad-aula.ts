import type { AccessibilityPreference, InstructionMode } from './accesibilidad-clase';
import type { CommunicationPreference } from './index';

/**
 * ¿Esta aula coincide con la preferencia de comunicación del estudiante?
 * (HU-211, `ARQUITECTURA.md` §4.9, decisión D21. **Superada por D44** —
 * `coincideConLaAccesibilidad()`, abajo, es la función nueva.)
 *
 * **Desacoplada de `Classroom` a propósito (HU-506):** el modelo del aula ya
 * no tiene `communicationModes` — lo retiró HU-506 — así que esta firma toma
 * la forma vieja como un objeto suelto. Sigue existiendo solo porque el
 * frontend (HU-507) aún no ha migrado a `coincideConLaAccesibilidad()`;
 * ningún dato real del backend tiene ya esta forma.
 */
export function coincideConLaPreferencia(
  aula: { communicationModes: CommunicationPreference[] },
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
