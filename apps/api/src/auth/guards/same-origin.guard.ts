import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/** Cabecera que solo el propio frontend manda; un `<form>` cross-site no puede fijarla. */
export const CUSTOM_HEADER_NAME = 'x-requested-with';
export const CUSTOM_HEADER_VALUE = 'bighearts';

/**
 * Bloquea CSRF en `/auth/refresh` y `/auth/logout`: sin token anti-CSRF, exige
 * una cabecera que un `<form>` autoenviado no puede poner.
 */
@Injectable()
export class SameOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.headers[CUSTOM_HEADER_NAME] !== CUSTOM_HEADER_VALUE) {
      throw new ForbiddenException('Origen no permitido.');
    }

    return true;
  }
}
