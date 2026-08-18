import { NotFoundException } from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';

/**
 * Fábricas de las excepciones de dominio de usuarios.
 *
 * Cada una lleva un `code` estable de @academia/types y un texto en español
 * para el usuario final; el AllExceptionsFilter global las traduce al envelope
 * `ApiResponse`.
 */

/**
 * El usuario del token ya no existe en la BD.
 *
 * Es una carrera rara pero real: el access token vive 15 minutos y se verifica
 * solo por firma (el guard no toca la BD), así que sobrevive a que un
 * administrador borre la cuenta. Se responde 404 y no 401 a propósito: el token
 * es válido, lo que falta es el recurso.
 */
export const profileNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.USER_NOT_FOUND,
    message: 'No encontramos tu perfil. Inicia sesión de nuevo.',
  });
