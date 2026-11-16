import type { UrlDeSubida } from '@academia/types';

export interface MetadatosObjeto {
  bytes: number;
}

/** Vida de las URLs firmadas de lectura (D51). */
export const TTL_LECTURA_SEGUNDOS = 60 * 60;

/**
 * Claves válidas: `videos/<entradaId>/<uuid>.mp4|.jpg` e `imagenes/<entradaId>/<uuid>.webp|.jpg`.
 * Todo lo demás se rechaza: evita recorrer rutas en el adaptador local.
 */
export const CLAVE_VALIDA =
  /^(videos\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|jpg)|imagenes\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg))$/;

/**
 * PUERTO de almacenamiento de medios (D51), igual que `NotificationService` (D14): los
 * llamadores no saben si detrás está Supabase Storage o el disco local.
 */
export abstract class AlmacenamientoMedios {
  abstract readonly nombre: string;

  /** URL firmada para que el navegador suba el archivo directo, sin pasar por la API. */
  abstract urlDeSubida(clave: string, tipo: string, maxBytes: number): Promise<UrlDeSubida>;

  /** URLs firmadas de lectura, pedidas en lote. Las claves que no existen no aparecen. */
  abstract urlsDeLectura(
    claves: readonly string[],
    ttlSegundos: number,
  ): Promise<Map<string, string>>;

  /** `null` si el objeto no existe. */
  abstract metadatos(clave: string): Promise<MetadatosObjeto | null>;

  /** Borra sin fallar si alguna clave ya no existe. */
  abstract borrar(claves: readonly string[]): Promise<void>;
}
