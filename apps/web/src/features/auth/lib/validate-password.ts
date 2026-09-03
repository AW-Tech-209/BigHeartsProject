/**
 * Regla de fuerza de la contraseña, compartida por el registro y el
 * restablecimiento. Refleja la del backend; el servidor sigue siendo la fuente
 * de verdad. Devuelve el mensaje de error, o `undefined` si es válida.
 */
export function validatePassword(value: string): string | undefined {
  if (!value) return 'La contraseña es obligatoria.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
    return 'La contraseña debe incluir al menos una letra y un número.';
  }
  return undefined;
}
