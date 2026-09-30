import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { passwordChangeRequired, unauthenticated } from '../auth.errors';
import type { AuthenticatedUser, JwtPayload } from '../auth.types';
import { ALLOW_PASSWORD_CHANGE_KEY } from '../decorators/allow-password-change.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard de autenticación GLOBAL (se registra como APP_GUARD).
 *
 * Cierra la API por defecto: toda ruta exige un Access Token válido en la
 * cabecera `Authorization: Bearer <token>`, salvo las marcadas con `@Public()`.
 * Verifica el JWT por firma (sin tocar la BD) y adjunta el usuario a
 * `request.user` para `@CurrentUser()`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw unauthenticated();
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      // Firma inválida, token expirado o malformado: todo se trata igual.
      throw unauthenticated();
    }

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (payload.debeCambiarContrasena && !allowed) {
      throw passwordChangeRequired();
    }

    (request as Request & { user: AuthenticatedUser }).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      debeCambiarContrasena: payload.debeCambiarContrasena ?? false,
    };
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
