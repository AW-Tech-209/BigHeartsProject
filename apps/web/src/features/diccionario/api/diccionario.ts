import {
  BUSQUEDA_LIMITE_DEFAULT,
  type BusquedaResponse,
  type DiccionarioInicioResponse,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

export function getDiccionarioInicio(): Promise<DiccionarioInicioResponse> {
  return httpClient.get<DiccionarioInicioResponse>('/diccionario');
}

export function buscarEnDiccionario(
  q: string,
  limite: number = BUSQUEDA_LIMITE_DEFAULT,
): Promise<BusquedaResponse> {
  return httpClient.get<BusquedaResponse>('/diccionario/buscar', { params: { q, limite } });
}
