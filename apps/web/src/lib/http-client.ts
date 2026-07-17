import type { ApiError, ApiResponse } from '@academia/types';
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { ApiClientError } from './api-error';
import { tokenStorage } from './auth/token-storage';

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

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();

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
  (error: unknown) => {
    if (axios.isAxiosError<ApiResponse>(error)) {
      if (error.response?.status === 401) {
        tokenStorage.clear();
      }

      const body = error.response?.data;

      if (body && !body.success) {
        return Promise.reject(new ApiClientError(body.error, error.response?.status));
      }

      const networkError: ApiError = {
        code: 'NETWORK_ERROR',
        message: error.message,
      };

      return Promise.reject(new ApiClientError(networkError));
    }

    return Promise.reject(error);
  },
);

export const httpClient = instance as HttpClient;
