import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiErrorCode } from '@academia/types';

/**
 * Rate limiting de los endpoints sensibles de `/auth` (login y registro).
 *
 * Extiende el guard de @nestjs/throttler solo para traducir el 429 al envelope
 * del proyecto: código estable `TOO_MANY_REQUESTS` + mensaje en español, en vez
 * del "Too Many Requests" en inglés por defecto. Los límites (ventana e
 * intentos) salen de la config (`AUTH_THROTTLE_TTL` / `AUTH_THROTTLE_LIMIT`).
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        code: ApiErrorCode.TOO_MANY_REQUESTS,
        message: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
