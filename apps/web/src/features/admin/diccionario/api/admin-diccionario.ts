import type {
  AvanceDiccionarioResponse,
  CategoriasAdminResponse,
  EditarEntradaInput,
  EntradaAdmin,
  EntradasAdminQuery,
  EntradasAdminResponse,
  LoteEntradasInput,
  LoteEntradasResponse,
  ModulosAdminResponse,
  PapeleraResponse,
  PurgaResponse,
  RestaurarEntradaInput,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

const BASE = '/admin/diccionario';

export function getAvance(): Promise<AvanceDiccionarioResponse> {
  return httpClient.get<AvanceDiccionarioResponse>(`${BASE}/avance`);
}

export function getEntradasAdmin(query: EntradasAdminQuery): Promise<EntradasAdminResponse> {
  return httpClient.get<EntradasAdminResponse>(`${BASE}/entradas`, { params: query });
}

export function editarEntrada(id: string, input: EditarEntradaInput): Promise<EntradaAdmin> {
  return httpClient.patch<EntradaAdmin>(`${BASE}/entradas/${id}`, input);
}

export function aplicarLote(input: LoteEntradasInput): Promise<LoteEntradasResponse> {
  return httpClient.post<LoteEntradasResponse>(`${BASE}/entradas/lote`, input);
}

export function getModulosAdmin(): Promise<ModulosAdminResponse> {
  return httpClient.get<ModulosAdminResponse>(`${BASE}/modulos`);
}

export function getCategoriasAdmin(): Promise<CategoriasAdminResponse> {
  return httpClient.get<CategoriasAdminResponse>(`${BASE}/categorias`);
}

export function getPapelera(): Promise<PapeleraResponse> {
  return httpClient.get<PapeleraResponse>(`${BASE}/papelera`);
}

export function restaurarEntrada(id: string, input: RestaurarEntradaInput = {}): Promise<void> {
  return httpClient.post<void>(`${BASE}/papelera/${id}/restaurar`, input);
}

export function eliminarParaSiempre(id: string): Promise<PurgaResponse> {
  return httpClient.delete<PurgaResponse>(`${BASE}/papelera/${id}`);
}

export function vaciarPapelera(): Promise<PurgaResponse> {
  return httpClient.delete<PurgaResponse>(`${BASE}/papelera`);
}
