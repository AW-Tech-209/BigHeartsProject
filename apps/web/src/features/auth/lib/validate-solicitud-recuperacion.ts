const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validación del email en la pantalla «Recupera tu contraseña». Devuelve el
 * mensaje de error, o `undefined` si el email tiene forma válida.
 */
export function validateSolicitudRecuperacion(email: string): string | undefined {
  if (!email.trim()) return 'El email es obligatorio.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'El email no tiene un formato válido.';
  return undefined;
}
