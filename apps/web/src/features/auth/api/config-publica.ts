import type { ConfigPublica } from '@academia/types';

import { httpClient } from '@/lib/http-client';

/** Llama a `GET /config/publica`. */
export function obtenerConfigPublica(): Promise<ConfigPublica> {
  return httpClient.get<ConfigPublica>('/config/publica');
}
