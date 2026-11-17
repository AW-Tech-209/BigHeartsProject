import type {
  CategoriaAdmin,
  CrearCategoriaInput,
  EditarCategoriaInput,
  EditarModuloInput,
  EliminarConEntradasInput,
  UnidadAdmin,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

const BASE = '/admin/diccionario';

export function editarModulo(id: string, input: EditarModuloInput): Promise<void> {
  return httpClient.patch<void>(`${BASE}/modulos/${id}`, input);
}

export function crearUnidad(moduloId: string, nombre: string): Promise<UnidadAdmin> {
  return httpClient.post<UnidadAdmin>(`${BASE}/modulos/${moduloId}/unidades`, { nombre });
}

export function editarUnidad(id: string, nombre: string): Promise<void> {
  return httpClient.patch<void>(`${BASE}/unidades/${id}`, { nombre });
}

export function reordenarUnidades(moduloId: string, ids: string[]): Promise<void> {
  return httpClient.patch<void>(`${BASE}/modulos/${moduloId}/unidades/orden`, { ids });
}

export function eliminarUnidad(id: string, input: EliminarConEntradasInput): Promise<void> {
  return httpClient.delete<void>(`${BASE}/unidades/${id}`, { data: input });
}

export function crearCategoria(input: CrearCategoriaInput): Promise<CategoriaAdmin> {
  return httpClient.post<CategoriaAdmin>(`${BASE}/categorias`, input);
}

export function editarCategoria(id: string, input: EditarCategoriaInput): Promise<void> {
  return httpClient.patch<void>(`${BASE}/categorias/${id}`, input);
}

export function reordenarCategorias(ids: string[]): Promise<void> {
  return httpClient.patch<void>(`${BASE}/categorias/orden`, { ids });
}

export function eliminarCategoria(id: string, input: EliminarConEntradasInput): Promise<void> {
  return httpClient.delete<void>(`${BASE}/categorias/${id}`, { data: input });
}
