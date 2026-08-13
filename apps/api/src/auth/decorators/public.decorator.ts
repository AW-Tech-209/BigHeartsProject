import { SetMetadata } from '@nestjs/common';

/** Clave de metadato que marca un handler/clase como público. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como PÚBLICO: el `JwtAuthGuard` global lo dejará pasar sin
 * exigir un access token. Se usa en login, registro, refresh, logout y health.
 *
 * Todo lo NO marcado con `@Public()` requiere sesión: es un cierre por defecto
 * (secure-by-default), no por lista.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
