import {
  ENTRADAS_ADMIN_PAGE_SIZE_MAX,
  type CrearEntradaInput,
  type EditarEntradaInput,
  type EntradasAdminQuery,
  type LoteEntradasInput,
  type RestaurarEntradaInput,
} from '@academia/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  aplicarLote,
  crearEntrada,
  enviarAPapelera,
  getEntradaAdmin,
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
import { getSinSena } from '../api/medios';

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

export function useEntradaAdmin(id: string | undefined) {
  return useQuery({
    queryKey: [CLAVE, 'entrada', id],
    queryFn: () => getEntradaAdmin(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCrearEntrada() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (input: CrearEntradaInput) => crearEntrada(input),
    onSuccess: invalidar,
  });
}

export function useEnviarAPapelera() {
  const invalidar = useInvalidarTodo();
  return useMutation({ mutationFn: enviarAPapelera, onSuccess: invalidar });
}

export function useSinSena() {
  return useQuery({ queryKey: [CLAVE, 'sin-sena'], queryFn: getSinSena });
}

/** Todas las entradas (en páginas de 100) para emparejar archivos y asignar a mano. */
export function useTodasLasEntradas() {
  return useQuery({
    queryKey: [CLAVE, 'todas'],
    queryFn: async () => {
      const pageSize = ENTRADAS_ADMIN_PAGE_SIZE_MAX;
      const primera = await getEntradasAdmin({ page: 1, pageSize });
      const paginas = Math.ceil(primera.total / pageSize);
      const resto = await Promise.all(
        Array.from({ length: Math.max(0, paginas - 1) }, (_, i) =>
          getEntradasAdmin({ page: i + 2, pageSize }),
        ),
      );
      return [primera, ...resto].flatMap((r) => r.items);
    },
    staleTime: 60_000,
  });
}

/** Cambios de estructura: sin mutación optimista; al responder se refresca la consola y la lectura. */
export function useAccionEstructura() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (accion: () => Promise<unknown>) => accion(),
    onSuccess: invalidar,
  });
}
