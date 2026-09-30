import type {
  AdminUsuariosQuery,
  AdminUsuariosResponse,
  CrearUsuarioInput,
  CuentaCreadaResponse,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

export function getAdminUsuarios(query: AdminUsuariosQuery): Promise<AdminUsuariosResponse> {
  return httpClient.get<AdminUsuariosResponse>('/admin/usuarios', { params: query });
}

export function crearUsuario(input: CrearUsuarioInput): Promise<CuentaCreadaResponse> {
  return httpClient.post<CuentaCreadaResponse>('/admin/usuarios', input);
}

export function generarContrasenaTemporal(id: string): Promise<CuentaCreadaResponse> {
  return httpClient.post<CuentaCreadaResponse>(`/admin/usuarios/${id}/contrasena-temporal`);
}
