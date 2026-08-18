import type { AuthSession, User } from '@academia/types';
import { create } from 'zustand';

/**
 * Estado de la sesión, en el orden en que ocurre:
 *  - `checking`  → todavía no sabemos si hay sesión; se está llamando a
 *                  `/auth/refresh` para rehidratar (arranque de la app).
 *  - `authenticated` → hay usuario y access token en memoria.
 *  - `anonymous` → no hay sesión (nunca la hubo, caducó, o se cerró).
 *
 * Empieza en `checking` a propósito: al recargar la página el access token se
 * pierde (vive en memoria), así que hasta que el refresh conteste no podemos
 * afirmar que el usuario NO tiene sesión. Sin este estado intermedio, el guard
 * de rutas expulsaría a login a todo el mundo en cada F5.
 */
export type SessionStatus = 'checking' | 'authenticated' | 'anonymous';

/**
 * Por qué terminó la sesión. Lo lee la pantalla de login para explicar el
 * motivo en vez de limitarse a aparecer.
 *
 *  - `none`   → nunca hubo sesión en esta carga (o ya se explicó el motivo).
 *  - `expired` → la había y se perdió: el refresh token caducó, se revocó, o
 *    un administrador suspendió la cuenta.
 *  - `logout` → el usuario pulsó "Cerrar sesión". Es lo que pidió, no un fallo.
 */
export type SessionEndReason = 'none' | 'expired' | 'logout';

type AuthState = {
  status: SessionStatus;
  user: User | null;
  endReason: SessionEndReason;
  /**
   * Access token JWT (15 min). Vive SOLO aquí, en memoria de JavaScript.
   *
   * Nunca en `localStorage`/`sessionStorage`: lo que hay en disco lo puede leer
   * cualquier XSS y sobrevive al cierre de la pestaña. La persistencia entre
   * visitas la da el refresh token, que va en una cookie httpOnly que este
   * código NO puede leer (ver AUTH_FLOW.md). Por eso el store NO usa el
   * middleware `persist`: sería exactamente el fallo que estamos evitando.
   */
  accessToken: string | null;

  /** Guarda la sesión que devolvió un login o un refresh correctos. */
  setSession: (session: AuthSession) => void;
  /**
   * Refresca los datos del usuario sin tocar el token ni el estado de sesión.
   *
   * Lo usa la edición del perfil (HU-103): al guardar, el nombre de la barra de
   * sesión tiene que cambiar sin recargar. No sirve `setSession` para esto,
   * porque obligaría a inventar un `accessToken`; y sobrescribir el token con
   * uno falso rompería la siguiente petición.
   *
   * Es un no-op si no hay sesión: sin usuario que refrescar, escribir uno aquí
   * dejaría el store en un estado imposible (usuario sin token).
   */
  setUser: (user: User) => void;
  /** Borra la sesión: logout, refresh fallido, o no había sesión al arrancar. */
  clearSession: (reason?: SessionEndReason) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'checking',
  user: null,
  accessToken: null,
  endReason: 'none',

  setSession: (session) =>
    set({
      status: 'authenticated',
      user: session.user,
      accessToken: session.accessToken,
      endReason: 'none',
    }),

  setUser: (user) => set((state) => (state.user === null ? state : { user })),

  clearSession: (reason = 'none') =>
    set((state) => ({
      status: 'anonymous',
      user: null,
      accessToken: null,
      // Solo es una sesión "caducada" si de verdad había una que perder. Al
      // arrancar la app el refresh también falla cuando el visitante nunca
      // entró, y decirle "tu sesión terminó" a quien nunca la abrió lo dejaría
      // buscando un problema que no existe.
      endReason: reason === 'expired' && state.status !== 'authenticated' ? 'none' : reason,
    })),
}));

/**
 * Lee el access token fuera de React (lo necesita el interceptor de axios, que
 * no es un componente y por tanto no puede usar el hook).
 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
