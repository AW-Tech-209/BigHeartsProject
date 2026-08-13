import type { AuthSession, UserRole, UserStatus } from '@academia/types';

/**
 * Claims que viajan firmados dentro del Access Token JWT.
 *
 * `sub` es el id del usuario (convención de JWT). Incluimos `role` y `status`
 * para que los guards puedan autorizar sin ir a la BD en cada petición: el
 * token es de vida corta, así que la foto que lleva es "suficientemente fresca".
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Usuario autenticado que el `JwtAuthGuard` adjunta a `request.user` tras
 * verificar el token. Es lo que reciben los controladores vía `@CurrentUser()`.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Resultado interno de emitir una sesión (login o refresh).
 *
 * `session` es lo que viaja en el cuerpo de la respuesta (contrato público);
 * `refreshToken` + `refreshExpiresAt` los usa el controlador para plantar la
 * cookie httpOnly. El refresh token NUNCA se serializa en el cuerpo.
 */
export interface IssuedSession {
  session: AuthSession;
  refreshToken: string;
  refreshExpiresAt: Date;
}
