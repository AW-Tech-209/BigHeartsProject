/** Estado del formulario de login. */
export type LoginFormValues = {
  email: string;
  password: string;
};

/** Campo → mensaje de error. */
export type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validación en cliente del login: solo comprueba que los campos estén y que el
 * email tenga forma de email.
 *
 * NO se validan las reglas de fuerza de la contraseña (longitud, letra +
 * número). Esas reglas son del registro: una cuenta antigua puede tener una
 * contraseña que ya no las cumple, y decirle a esa persona "tu contraseña debe
 * tener 8 caracteres" cuando la suya tiene 6 sería un mensaje falso que le
 * impide entrar. Quién puede entrar lo decide el servidor.
 */
export function validateLogin(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!values.email.trim()) {
    errors.email = 'El email es obligatorio.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'El email no tiene un formato válido. Ejemplo: nombre@correo.com';
  }

  if (!values.password) {
    errors.password = 'La contraseña es obligatoria.';
  }

  return errors;
}
