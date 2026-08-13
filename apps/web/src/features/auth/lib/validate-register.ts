import type { CommunicationPreference, HearingLossLevel, RegisterableRole } from '@academia/types';

/** Estado del formulario de registro. Los enums usan '' = "sin indicar". */
export type RegisterFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RegisterableRole;
  hearingLossLevel: HearingLossLevel | '';
  communicationPreference: CommunicationPreference | '';
};

/** Campo → mensaje de error. Las claves coinciden con las del backend. */
export type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validación en cliente que refleja las reglas del RegisterDto del backend.
 * Da feedback inmediato; el backend sigue siendo la fuente de verdad (p. ej.
 * para el email duplicado, que solo él conoce).
 */
export function validateRegister(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.email.trim()) {
    errors.email = 'El email es obligatorio.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'El email no tiene un formato válido.';
  }

  if (!values.password) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (values.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(values.password)) {
    errors.password = 'La contraseña debe incluir al menos una letra y un número.';
  }

  if (!values.firstName.trim()) {
    errors.firstName = 'El nombre es obligatorio.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Los apellidos son obligatorios.';
  }

  return errors;
}
