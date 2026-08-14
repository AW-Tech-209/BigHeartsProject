import type { UserRole } from '@academia/types';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '../hooks/use-auth';
import { AccessDenied } from './access-denied';

type RequireAuthProps = {
  children: ReactNode;
  /** Si se indica, además de sesión se exige uno de estos roles. */
  roles?: UserRole[];
};

/**
 * Guard de rutas privadas. Envuelve el `element` de cada ruta protegida.
 *
 * Tres desenlaces, en este orden:
 *  1. `checking` → todavía se está rehidratando la sesión con la cookie. Se
 *     muestra un estado de carga. Sin este paso, un F5 en una ruta privada
 *     expulsaría a login a un usuario que sí tiene sesión, porque el access
 *     token vive en memoria y aún no ha vuelto.
 *  2. Sin sesión → redirect a `/login`, guardando de dónde venía para volver
 *     ahí tras entrar. `replace` evita que el botón "atrás" del navegador
 *     devuelva al usuario a una página que no puede ver.
 *  3. Con sesión pero rol insuficiente → pantalla de acceso denegado.
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { status, user, hasRole } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return <LoadingScreen>Comprobando tu sesión…</LoadingScreen>;
  }

  if (status === 'anonymous' || !user) {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  if (roles && !hasRole(...roles)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
