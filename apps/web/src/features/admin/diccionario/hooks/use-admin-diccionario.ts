import type {
  EditarEntradaInput,
  EntradasAdminQuery,
  LoteEntradasInput,
  RestaurarEntradaInput,
} from '@academia/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  aplicarLote,
  editarEntrada,
  eliminarParaSiempre,
  getAvance,
  getCategoriasAdmin,
  getEntradasAdmin,
  getModulosAdmin,
  getPapelera,
  restaurarEntrada,
  vaciarPapelera,
} from '../api/admin-diccionario';

const CLAVE = 'admin-diccionario';

export function useAvance() {
  return useQuery({ queryKey: [CLAVE, 'avance'], queryFn: getAvance });
}

export function useEntradasAdmin(query: EntradasAdminQuery) {
  return useQuery({
    queryKey: [CLAVE, 'entradas', query],
    queryFn: () => getEntradasAdmin(query),
    placeholderData: keepPreviousData,
  });
}

export function useModulosAdmin() {
  return useQuery({ queryKey: [CLAVE, 'modulos'], queryFn: getModulosAdmin, staleTime: 60_000 });
}

export function useCategoriasAdmin() {
  return useQuery({
    queryKey: [CLAVE, 'categorias'],
    queryFn: getCategoriasAdmin,
    staleTime: 60_000,
  });
}

export function usePapelera() {
  return useQuery({ queryKey: [CLAVE, 'papelera'], queryFn: getPapelera });
}

/** Sin mutaciones optimistas: la tabla cambia cuando el servidor responde y se vuelve a leer. */
function useInvalidarTodo() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [CLAVE] }),
      queryClient.invalidateQueries({ queryKey: ['diccionario'] }),
    ]);
}

export function useEditarEntrada() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditarEntradaInput }) =>
      editarEntrada(id, input),
    onSuccess: invalidar,
  });
}

export function useLoteEntradas() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (input: LoteEntradasInput) => aplicarLote(input),
    onSuccess: invalidar,
  });
}

export function useRestaurarEntradas() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: async ({ ids, input }: { ids: string[]; input?: RestaurarEntradaInput }) => {
      for (const id of ids) await restaurarEntrada(id, input);
    },
    onSettled: invalidar,
  });
}

export function useEliminarParaSiempre() {
  const invalidar = useInvalidarTodo();
  return useMutation({ mutationFn: eliminarParaSiempre, onSuccess: invalidar });
}

export function useVaciarPapelera() {
  const invalidar = useInvalidarTodo();
  return useMutation({ mutationFn: vaciarPapelera, onSuccess: invalidar });
}
