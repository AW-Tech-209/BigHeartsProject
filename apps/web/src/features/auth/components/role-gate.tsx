import type { UserRole } from '@academia/types';
import type { ReactNode } from 'react';

import { useAuth } from '../hooks/use-auth';

type RoleGateProps = {
  /** Roles que pueden ver el contenido. */
  roles: UserRole[];
  children: ReactNode;
  /** Qué pintar cuando el rol no coincide. Por defecto, nada. */
  fallback?: ReactNode;
};

/**
 * Oculta un trozo de UI según el rol del usuario.
 *
 * Ocultar, no deshabilitar: §13 prohíbe dejar un botón apagado sin explicación,
 * porque el usuario no puede diagnosticar por qué no funciona. O se muestra
 * algo que se puede usar, o se muestra un `fallback` que explica, o no se
 * muestra nada.
 *
 * Es una comodidad de interfaz, NO una medida de seguridad: quien controla lo
 * que un rol puede hacer de verdad es el backend. Aquí solo evitamos enseñar
 * acciones que acabarían en un error.
 */
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuth();

  return <>{hasRole(...roles) ? children : fallback}</>;
}
