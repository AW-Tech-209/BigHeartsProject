import { UserRole, UserStatus, type User } from '@academia/types';

import { useAuthStore } from '@/stores/auth-store';

/**
 * Un usuario de prueba con el rol que se pida.
 *
 * Importa `UserRole` y `UserStatus` como VALORES en tiempo de ejecución, que es
 * lo que rompe la trampa nº 1 del README cuando la config de test no hereda la
 * de Vite (`@academia/types` se compila a CommonJS).
 */
export function usuarioDePrueba(role: UserRole = UserRole.STUDENT): User {
  return {
    id: `user-${role.toLowerCase()}`,
    email: 'ana@correo.com',
    firstName: 'Ana',
    lastName: 'García',
    role,
    status: UserStatus.ACTIVE,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/**
 * Deja el auth-store con sesión abierta para ese rol, o sin sesión con `null`.
 *
 * Zustand vive fuera de React, así que un test que abre sesión se la deja
 * abierta al siguiente. Llámalo en `beforeEach`, siempre.
 */
export function darSesion(role: UserRole | null): User | null {
  if (role === null) {
    useAuthStore.setState({
      status: 'anonymous',
      user: null,
      accessToken: null,
      endReason: 'none',
    });
    return null;
  }

  const user = usuarioDePrueba(role);

  useAuthStore.setState({
    status: 'authenticated',
    user,
    accessToken: 'access.token.jwt',
    endReason: 'none',
  });

  return user;
}
