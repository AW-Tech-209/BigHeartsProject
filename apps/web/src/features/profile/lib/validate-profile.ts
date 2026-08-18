import type { CommunicationPreference, HearingLossLevel } from '@academia/types';

/** Estado del formulario de perfil. Los enums usan '' = "sin indicar". */
export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  hearingLossLevel: HearingLossLevel | '';
  communicationPreference: CommunicationPreference | '';
};

/** Campo → mensaje de error. Las claves coinciden con las del backend. */
export type ProfileFieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

/** Tope de `@MaxLength(100)` del UpdateProfileDto. Se replica para avisar antes. */
const MAX_NAME_LENGTH = 100;

/**
 * Validación en cliente que refleja las reglas del `UpdateProfileDto` del
 * backend. Da feedback inmediato; el backend sigue siendo la fuente de verdad.
 *
 * Los campos de accesibilidad no se validan aquí: cualquiera de sus opciones es
 * válida, incluida la de no indicar ninguna.
 */
export function validateProfile(values: ProfileFormValues): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  const firstName = values.firstName.trim();
  if (!firstName) {
    errors.firstName = 'El nombre es obligatorio.';
  } else if (firstName.length > MAX_NAME_LENGTH) {
    errors.firstName = 'El nombre es demasiado largo.';
  }

  const lastName = values.lastName.trim();
  if (!lastName) {
    errors.lastName = 'Los apellidos son obligatorios.';
  } else if (lastName.length > MAX_NAME_LENGTH) {
    errors.lastName = 'Los apellidos son demasiado largos.';
  }

  return errors;
}
