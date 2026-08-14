import type { ApiResponse, AuthSession } from '@academia/types';
import axios from 'axios';

import { ApiClientError, toApiClientError } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Cliente CRUDO, sin los interceptores de `http-client`.
 *
 * Es imprescindible que no los tenga: el interceptor de 401 de `http-client`
 * llama a `refreshSession()`. Si el refresh viajara por ese mismo cliente, un
 * 401 del propio refresh dispararía otro refresh, y otro, en bucle infinito.
 *
 * `withCredentials: true` es lo que hace que el navegador envíe la cookie
 * httpOnly `refresh_token` y acepte la cookie rotada de la respuesta. Sin esto
 * el refresh SIEMPRE falla con 401, aunque la sesión sea válida.
 */
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  // Tope de espera. Sin él, una API que tarda en despertar (el plan gratuito
  // de Render duerme el servicio y puede tardar cerca de un minuto) dejaría la
  // pantalla de login bloqueada en "Comprobando tu sesión…" todo ese rato, sin
  // dejar entrar a nadie. Si se agota, se asume "sin sesión": el usuario puede
  // iniciarla a mano, que es mejor que no poder hacer nada.
  timeout: 10_000,
});

/**
 * Refresh en vuelo, si lo hay. Sirve para colapsar llamadas concurrentes en una
 * sola ("single-flight").
 *
 * No es una optimización, es un requisito de corrección: el backend ROTA el
 * refresh token en cada uso y trata la reutilización de un token ya revocado
 * como señal de robo, revocando toda la familia de sesiones del usuario. Si dos
 * peticiones recibieran un 401 a la vez y cada una llamara a `/auth/refresh`,
 * la segunda presentaría la cookie vieja y cerraría la sesión de golpe.
 */
let refreshInFlight: Promise<AuthSession> | null = null;

/**
 * Renueva la sesión con la cookie httpOnly y actualiza el store.
 *
 * Se usa en dos momentos:
 *  1. Al arrancar la app, para rehidratar la sesión tras una recarga.
 *  2. Desde el interceptor de axios, cuando el access token caducó (401).
 *
 * Si falla, deja el store en `anonymous` y propaga una `ApiClientError`.
 */
export function refreshSession(): Promise<AuthSession> {
  refreshInFlight ??= requestRefresh().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function requestRefresh(): Promise<AuthSession> {
  try {
    const response = await refreshClient.post<ApiResponse<AuthSession>>('/auth/refresh');
    const body = response.data;

    if (!body.success) {
      throw new ApiClientError(body.error, response.status);
    }

    useAuthStore.getState().setSession(body.data);
    return body.data;
  } catch (error) {
    // Cualquier fallo aquí significa "no hay sesión utilizable": cookie
    // ausente, caducada, revocada por un logout, o cuenta suspendida. En todos
    // los casos el estado correcto es `anonymous`, y el guard de rutas se
    // encarga de llevar al usuario a /login.
    //
    // Se marca como `expired` para que el login pueda explicar por qué se
    // cortó. El store lo ignora si no había sesión que perder (arranque de la
    // app sin cookie), así que aquí no hace falta distinguir el caso.
    useAuthStore.getState().clearSession('expired');
    throw toApiClientError(error);
  }
}
