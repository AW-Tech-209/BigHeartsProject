import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@academia/types';
import type { Request } from 'express';

import { insufficientRole, unauthenticated } from '../auth.errors';
import type { AuthenticatedUser } from '../auth.types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard de autorización por rol. Se registra como APP_GUARD **después** del
 * `JwtAuthGuard`, y esa composición es todo el diseño:
 *
 *  1. `JwtAuthGuard` decide si HAY sesión y planta `request.user`.
 *  2. Este decide si esa sesión ALCANZA para el endpoint.
 *
 * Es global pero **abre por defecto**: sin `@Roles(...)` en el handler ni en la
 * clase, deja pasar. Lo contrario —una lista blanca de rutas por rol— obliga a
 * tocar un fichero central cada vez que nace un endpoint, y el día que alguien
 * se olvida el fallo es un 403 en producción, no un test en rojo.
 *
 * El rol sale del ACCESS TOKEN, no de la BD. El token vive 15 minutos, así que
 * un cambio de rol tarda como mucho eso en surtir efecto; a cambio, autorizar
 * no cuesta una consulta por petición. Si algún día hiciera falta revocación
 * inmediata de un rol, se resuelve acortando el token o revocando la familia de
 * refresh, no consultando aquí.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    // Un endpoint con @Roles y sin usuario significa que se marcó @Public() a la
    // vez, que es una contradicción. Se cierra en vez de abrirse: ante una
    // configuración incoherente, la respuesta segura es no dejar pasar.
    if (!user) {
      throw unauthenticated();
    }

    if (!required.includes(user.role)) {
      throw insufficientRole();
    }

    return true;
  }
}
