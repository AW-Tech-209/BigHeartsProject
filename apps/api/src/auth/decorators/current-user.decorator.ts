import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../auth.types';

/**
 * Inyecta el usuario autenticado (`request.user`, que planta el `JwtAuthGuard`)
 * en un parámetro del controlador. Solo tiene sentido en rutas protegidas: en
 * una ruta `@Public()` no habrá usuario.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return request.user;
  },
);
