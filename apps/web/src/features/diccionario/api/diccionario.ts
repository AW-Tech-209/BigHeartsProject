import {
  BUSQUEDA_LIMITE_DEFAULT,
  type BusquedaResponse,
  type CategoriaDetalleResponse,
  type CategoriaQuery,
  type DiccionarioInicioResponse,
  type ModuloDetalleResponse,
  type ModuloQuery,
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

export function getModulo(numero: number, query: ModuloQuery): Promise<ModuloDetalleResponse> {
  return httpClient.get<ModuloDetalleResponse>(`/diccionario/modulos/${numero}`, { params: query });
}

export function getCategoria(
  numero: number,
  slug: string,
  query: CategoriaQuery,
): Promise<CategoriaDetalleResponse> {
  return httpClient.get<CategoriaDetalleResponse>(
    `/diccionario/modulos/${numero}/categorias/${encodeURIComponent(slug)}`,
    { params: query },
  );
}
