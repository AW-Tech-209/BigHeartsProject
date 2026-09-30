import { useQuery } from '@tanstack/react-query';

import { obtenerConfigPublica } from '../api/config-publica';

const CINCO_MINUTOS = 5 * 60 * 1000;

/**
 * Pregunta al servidor si el registro está abierto. Mientras no responde (o si
 * falla) se trata como cerrado: es el valor seguro y el que el servidor impone.
 */
export function useRegistroAbierto() {
  const { data, isPending } = useQuery({
    queryKey: ['config-publica'],
    queryFn: obtenerConfigPublica,
    staleTime: CINCO_MINUTOS,
  });

  return { cargando: isPending, abierto: data?.registroAbierto === true };
}
