/**
 * Coste de bcrypt: 2^12 iteraciones. Es el valor acordado como convención de
 * seguridad del proyecto; lo usan tanto el registro como el seed del admin.
 */
export const BCRYPT_SALT_ROUNDS = 12;
