import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiErrorCode } from '@academia/types';

/**
 * Rate limiting global (`APP_GUARD`, `app.module.ts`): solo traduce el 429 al
 * envelope del proyecto. El límite base es el de `/auth`; el resto lo afloja
 * `@Throttle(API_THROTTLE)` (`common/api-throttle.ts`).
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
