import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';

/**
 * Fábricas de las excepciones de dominio de autenticación.
 *
 * Cada una lleva un `code` estable de @academia/types (que el frontend usa para
 * decidir el mensaje) y un texto en español pensado para el usuario final. El
 * AllExceptionsFilter global las traduce al envelope `ApiResponse`.
 */

/**
 * Credenciales inválidas en el login. El mensaje es DELIBERADAMENTE genérico
 * (no dice si falló el email o la contraseña) para no ayudar a enumerar cuentas.
 */
export const invalidCredentials = (): UnauthorizedException =>
  new UnauthorizedException({
    code: ApiErrorCode.INVALID_CREDENTIALS,
    message: 'Email o contraseña incorrectos.',
  });

/** El refresh token falta, es inválido, caducó o ya fue usado/revocado. */
export const invalidRefreshToken = (): UnauthorizedException =>
  new UnauthorizedException({
    code: ApiErrorCode.INVALID_REFRESH_TOKEN,
    message: 'Tu sesión no es válida o ha caducado. Inicia sesión de nuevo.',
  });

/** El token de recuperación no existe o ya se usó. Mismo código para ambos casos. */
export const passwordResetTokenInvalid = (): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.PASSWORD_RESET_TOKEN_INVALID,
    message: 'El enlace de recuperación no es válido o ya se usó. Solicita uno nuevo.',
  });

/** El token de recuperación caducó (`PASSWORD_RESET_EXPIRY_MINUTES`). */
export const passwordResetTokenExpired = (): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.PASSWORD_RESET_TOKEN_EXPIRED,
    message: 'El enlace de recuperación caducó. Solicita uno nuevo.',
  });

/** Falta el access token o es inválido en una ruta protegida. */
export const unauthenticated = (): UnauthorizedException =>
  new UnauthorizedException({
    code: ApiErrorCode.UNAUTHENTICATED,
    message: 'Necesitas iniciar sesión para acceder a este recurso.',
  });

/** La cuenta está suspendida por un administrador: no puede iniciar sesión. */
export const accountSuspended = (): ForbiddenException =>
  new ForbiddenException({
    code: ApiErrorCode.ACCOUNT_SUSPENDED,
    message: 'Tu cuenta está suspendida. Contacta con el equipo de soporte.',
  });

/** La cuenta está pendiente de aprobación (profesor): aún no puede entrar. */
export const accountPending = (): ForbiddenException =>
  new ForbiddenException({
    code: ApiErrorCode.ACCOUNT_PENDING,
    message: 'Tu cuenta está pendiente de aprobación. Te avisaremos por correo cuando esté lista.',
  });

/**
 * Un administrador denegó la solicitud de registro del profesor.
 *
 * El mensaje NO dice "suspendida": esta cuenta nunca estuvo activa, y decirle
 * lo contrario al usuario sería falso. Es el motivo entero de que `REJECTED`
 * exista como estado propio (D13).
 */
export const accountRejected = (): ForbiddenException =>
  new ForbiddenException({
    code: ApiErrorCode.ACCOUNT_REJECTED,
    message:
      'Tu solicitud de cuenta de profesor no fue aprobada. Escribe al equipo de soporte si crees que es un error.',
  });

/** Hay sesión, pero el rol no alcanza para el endpoint. Lo lanza el RolesGuard. */
export const insufficientRole = (): ForbiddenException =>
  new ForbiddenException({
    code: ApiErrorCode.INSUFFICIENT_ROLE,
    message: 'Tu cuenta no tiene permiso para esta acción.',
  });
