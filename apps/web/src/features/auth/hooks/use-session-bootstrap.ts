import { useEffect } from 'react';

import { refreshSession } from '@/lib/auth/refresh-session';

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

    // El fallo es un resultado esperado ("no había sesión"), no una excepción:
    // `refreshSession` ya deja el store en `anonymous` por su cuenta.
    void refreshSession().catch(() => undefined);
  }, []);
}
