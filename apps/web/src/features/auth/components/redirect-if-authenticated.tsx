import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '../hooks/use-auth';

/**
 * Envuelve las pantallas que no tienen sentido con la sesión abierta (login).
 *
 * Espera a que termine la rehidratación antes de pintar nada: si mostrara el
 * formulario durante el `checking`, un usuario con sesión válida vería el login
 * aparecer y desaparecer, y podría llegar a escribir su contraseña en un
 * formulario que está a punto de desmontarse.
 */
export function RedirectIfAuthenticated({
  children,
  to = '/panel',
}: {
  children: ReactNode;
  to?: string;
}) {
  const { status } = useAuth();

  if (status === 'checking') {
    return <LoadingScreen>Comprobando tu sesión…</LoadingScreen>;
  }

  if (status === 'authenticated') {
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
