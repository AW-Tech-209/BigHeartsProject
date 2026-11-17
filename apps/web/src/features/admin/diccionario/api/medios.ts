import type {
  ConfirmarVideoResponse,
  SinSenaResponse,
  SubidaImagenInput,
  SubidaImagenResponse,
  SubidaVideoInput,
  SubidaVideoResponse,
  UrlDeSubida,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

const entrada = (id: string) => `/admin/diccionario/entradas/${id}`;

export function pedirSubidaVideo(
  id: string,
  input: SubidaVideoInput,
): Promise<SubidaVideoResponse> {
  return httpClient.post<SubidaVideoResponse>(`${entrada(id)}/video/subida`, input);
}

export function confirmarVideo(id: string, videoId: string): Promise<ConfirmarVideoResponse> {
  return httpClient.post<ConfirmarVideoResponse>(`${entrada(id)}/video/${videoId}/confirmar`);
}

export function quitarVideo(id: string): Promise<void> {
  return httpClient.delete<void>(`${entrada(id)}/video`);
}

export function pedirSubidaImagen(
  id: string,
  input: SubidaImagenInput,
): Promise<SubidaImagenResponse> {
  return httpClient.post<SubidaImagenResponse>(`${entrada(id)}/imagen/subida`, input);
}

export function confirmarImagen(id: string, clave: string): Promise<void> {
  return httpClient.post<void>(`${entrada(id)}/imagen/confirmar`, { clave });
}

export function quitarImagen(id: string): Promise<void> {
  return httpClient.delete<void>(`${entrada(id)}/imagen`);
}

/**
 * Sube el archivo DIRECTO al almacenamiento con la URL firmada. XHR y no fetch: es lo único
 * que informa el progreso de una subida. `senal` permite cancelarla.
 */
export function subirArchivo(
  destino: UrlDeSubida,
  cuerpo: Blob,
  alAvanzar: (bytes: number) => void,
  senal: AbortSignal,
): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const xhr = new XMLHttpRequest();
    xhr.open(destino.metodo, destino.url);
    for (const [nombre, valor] of Object.entries(destino.headers))
      xhr.setRequestHeader(nombre, valor);
    xhr.upload.onprogress = (e) => alAvanzar(e.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolver()
        : rechazar(new Error('El almacenamiento rechazó el archivo. Inténtalo de nuevo.'));
    xhr.onerror = () =>
      rechazar(new Error('Se cortó la conexión durante la subida. Inténtalo de nuevo.'));
    xhr.onabort = () => rechazar(new DOMException('Subida cancelada', 'AbortError'));
    senal.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(cuerpo);
  });
}

export function getSinSena(): Promise<SinSenaResponse> {
  return httpClient.get<SinSenaResponse>('/admin/diccionario/sin-sena');
}
