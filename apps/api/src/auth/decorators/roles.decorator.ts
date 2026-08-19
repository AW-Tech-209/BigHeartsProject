import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@academia/types';

/** Clave de metadato con los roles que un handler/clase exige. */
export const ROLES_KEY = 'requiredRoles';

/**
 * Exige uno de estos roles para entrar al endpoint. El `RolesGuard` global lo
 * aplica; sin este decorador, un endpoint solo exige sesión.
 *
 * ```ts
 * @Roles(UserRole.ADMIN)
 * @Get('teachers/pending')
 * ```
 *
 * Es la ÚNICA forma de autorizar por rol en este repo. Comprobar
 * `current.role === 'ADMIN'` a mano dentro de un controlador o un service
 * funciona igual de bien hasta que alguien añade el segundo endpoint y se
 * olvida — el decorador hace visible en la firma qué protege cada ruta, y deja
 * la regla en un solo sitio testeable.
 *
 * Que el frontend oculte un botón NO es autorización: quien decide es esto.
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
