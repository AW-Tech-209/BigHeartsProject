import type { ApiResponse } from '@academia/types';
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { ApiClientError, toApiClientError } from './api-error';
import { refreshSession } from './auth/refresh-session';
import { getAccessToken } from '@/stores/auth-store';

// El interceptor de éxito de abajo desenvuelve `ApiResponse<T>` y devuelve
// directamente `T`, no un `AxiosResponse<T>`. Este tipo lo refleja para que
// los callers de `httpClient.get<T>(...)` reciban `Promise<T>` de verdad, en
// vez del `Promise<AxiosResponse<T>>` que asumen los tipos de axios por
// defecto (que además tienen su propio `status`, fácil de confundir con el
// payload real).
type HttpClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> & {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

/**
 * Config de una petición marcada como ya reintentada tras renovar el token.
 * La marca evita que un 401 persistente entre en un bucle refresh → reintento
 * → 401 → refresh…: solo se concede un reintento por petición.
 */
type RetriedConfig = InternalAxiosRequestConfig & { _sessionRetry?: boolean };

/**
 * Rutas de autenticación que NUNCA deben disparar un refresh automático.
 *
 *  - `/auth/login` y `/auth/register`: su 401/403 ES la respuesta que la
 *    pantalla quiere mostrar (credenciales inválidas), no un token caducado.
 *  - `/auth/refresh` y `/auth/logout`: se apoyan en la cookie, no en el access
 *    token; renovarlos sería recursivo.
 */
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function isAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_PATHS.some((path) => url.startsWith(path));
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Necesario para que viaje la cookie httpOnly del refresh token (`/auth/*`).
  // El navegador solo la adjunta si el cliente pide credenciales, y la API
  // responde con `Access-Control-Allow-Credentials: true`.
  withCredentials: true,
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

// Cada respuesta de @academia/api llega envuelta en `ApiResponse<T>`. Este
// interceptor desenvuelve el `data` en éxito, y en fallo (tanto errores HTTP
// como de red) siempre rechaza con una `ApiClientError`, así los callers no
// necesitan conocer la forma del envelope ni distinguir axios de la API.
instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse;

    if (!body.success) {
      throw new ApiClientError(body.error, response.status);
    }

    // El tipo real de retorno es el `data` desenvuelto, no un AxiosResponse:
    // ver el cast a `HttpClient` al final del archivo.
    return body.data as unknown as AxiosResponse;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError<ApiResponse>(error)) {
      return Promise.reject(error);
    }

    const config = error.config as RetriedConfig | undefined;
    const accessTokenExpired =
      error.response?.status === 401 && config != null && !config._sessionRetry;

    // Renovación silenciosa: el usuario no debe percibir que su access token
    // caducó. Se renueva y se REINTENTA la petición original con el token
    // nuevo, así la pantalla que la lanzó recibe los datos y nunca ve el 401.
    if (accessTokenExpired && !isAuthPath(config.url)) {
      config._sessionRetry = true;

      try {
        const session = await refreshSession();
        config.headers.set('Authorization', `Bearer ${session.accessToken}`);
        return await instance.request(config);
      } catch {
        // El refresh también falló: la sesión terminó de verdad.
        // `refreshSession` ya dejó el store en `anonymous`; el guard de rutas
        // se encarga del redirect a /login. Aquí solo propagamos el error
        // original, que es el que describe la petición que el usuario pidió.
        return Promise.reject(toApiClientError(error));
      }
    }

    return Promise.reject(toApiClientError(error));
  },
);

export const httpClient = instance as HttpClient;
