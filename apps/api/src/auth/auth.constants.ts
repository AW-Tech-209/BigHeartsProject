/**
 * Coste de bcrypt: 2^12 iteraciones. Es el valor acordado como convención de
 * seguridad del proyecto; lo usan tanto el registro como el seed del admin.
 */
export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash bcrypt "señuelo" (coste 12, de una cadena aleatoria desechada).
 *
 * En el login, si el email no existe, comparamos la contraseña contra ESTE hash
 * en vez de devolver antes: así el tiempo de respuesta es parecido exista o no
 * el email, y no se puede enumerar cuentas midiendo latencias. Nunca coincide
 * con ninguna contraseña real.
 */
export const DECOY_PASSWORD_HASH = '$2b$12$anDwpKyeI2BfvnBzZWZsIe6TgwdpQgJusvfTaOXHKr.rD9evWfLoO';

/** Nombre de la cookie httpOnly que transporta el refresh token. */
export const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * Path de la cookie del refresh token. Se limita a `/auth` porque solo los
 * endpoints de `/auth/refresh` y `/auth/logout` la necesitan; así no viaja en
 * cada petición a la API.
 */
export const REFRESH_COOKIE_PATH = '/auth';

/** Bytes de entropía del refresh token opaco (48 bytes ≈ 384 bits). */
export const REFRESH_TOKEN_BYTES = 48;
