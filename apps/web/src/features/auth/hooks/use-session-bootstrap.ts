import { useEffect } from 'react';

import { refreshSession } from '@/lib/auth/refresh-session';
import { hasSessionHint } from '@/lib/auth/session-hint';
import { useAuthStore } from '@/stores/auth-store';

const TIMEOUT_POR_DEFECTO_MS = 3_000;

function plazoDeRefresh(): number {
  const configurado = Number(import.meta.env.VITE_SESSION_REFRESH_TIMEOUT_MS);
  return Number.isFinite(configurado) && configurado > 0 ? configurado : TIMEOUT_POR_DEFECTO_MS;
}

/**
 * Se intenta la rehidratación UNA sola vez por carga de página.
 *
 * La bandera vive a nivel de módulo, no en un `useRef`, porque en desarrollo
 * `<StrictMode>` monta, desmonta y vuelve a montar cada componente: un ref se
 * reiniciaría y dispararía un segundo `/auth/refresh`. Eso no es inofensivo
 * aquí — el backend rota el refresh token en cada uso y trata la reutilización
 * como robo, revocando la sesión entera.
 */
let bootstrapStarted = false;

/**
 * Rehidrata la sesión al arrancar la app.
 *
 * El access token vive en memoria, así que una recarga (F5) lo borra. Lo que
 * sobrevive es la cookie httpOnly del refresh token, que el navegador guarda
 * solo. Al arrancar pedimos `/auth/refresh`: si la cookie sigue viva, volvemos
 * a tener sesión sin que el usuario escriba nada; si no, el store pasa a
 * `anonymous` y el guard de rutas hace su trabajo.
 */
export function useSessionBootstrap(): void {
  useEffect(() => {
    if (bootstrapStarted) return;
    bootstrapStarted = true;

    // Sin marca de sesión previa no hay cookie de refresh que valga: la landing
    // es pública y el visitante nuevo pasa a `anonymous` sin salir a la red.
    if (!hasSessionHint()) {
      useAuthStore.getState().clearSession();
      return;
    }

    // Con marca, se intenta el refresh pero no se espera indefinidamente: al
    // vencer el plazo la landing se vuelve usable; si la respuesta llega después
    // y es válida, `setSession` rehidrata igual.
    const plazo = setTimeout(() => {
      if (useAuthStore.getState().status === 'checking') {
        useAuthStore.getState().clearSession();
      }
    }, plazoDeRefresh());

    void refreshSession()
      .catch(() => undefined)
      .finally(() => clearTimeout(plazo));
  }, []);
}
