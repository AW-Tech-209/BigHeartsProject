import type {
  ConfirmarImportacionInput,
  ConfirmarImportacionResponse,
  VistaPreviaImportacionResponse,
} from '@academia/types';

import { httpClient } from '@/lib/http-client';

const BASE = '/admin/diccionario/importacion';

/** Analiza el CSV en el servidor sin escribir nada. */
export function pedirVistaPrevia(archivo: File): Promise<VistaPreviaImportacionResponse> {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return httpClient.post<VistaPreviaImportacionResponse>(`${BASE}/vista-previa`, datos);
}

export function confirmarImportacion(
  input: ConfirmarImportacionInput,
): Promise<ConfirmarImportacionResponse> {
  return httpClient.post<ConfirmarImportacionResponse>(`${BASE}/confirmar`, input);
}
