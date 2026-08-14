import type { User, UserRole } from '@academia/types';
import { useCallback } from 'react';

import { type SessionStatus, useAuthStore } from '@/stores/auth-store';

type Auth = {
  status: SessionStatus;
  user: User | null;
  /** `true` solo cuando hay sesión confirmada. Durante `checking` es `false`. */
  isAuthenticated: boolean;
  /** `true` mientras se rehidrata la sesión: aún no se sabe si hay usuario. */
  isChecking: boolean;
  /** ¿El usuario tiene alguno de estos roles? Para ocultar UI (§ guard de rol). */
  hasRole: (...roles: UserRole[]) => boolean;
};

/**
 * Acceso de solo lectura a la sesión desde cualquier componente.
 *
 * Cada campo se selecciona por separado a propósito: si el selector devolviera
 * un objeto nuevo, Zustand lo vería distinto en cada render (compara por
 * identidad) y provocaría re-renders infinitos.
 */
export function useAuth(): Auth {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  return {
    status,
    user,
    isAuthenticated: status === 'authenticated' && user !== null,
    isChecking: status === 'checking',
    hasRole,
  };
}
