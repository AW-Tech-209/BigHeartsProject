import { BUSQUEDA_MIN_CARACTERES, normalizarTexto } from '@academia/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { buscarEnDiccionario, getDiccionarioInicio } from '../api/diccionario';
import { borrarRecientes, leerRecientes, suscribirRecientes } from '../lib/recientes';

export const ESPERA_BUSQUEDA_MS = 150;

export function useDiccionarioInicio() {
  return useQuery({ queryKey: ['diccionario', 'inicio'], queryFn: getDiccionarioInicio });
}

/** `true` cuando el texto ya da para buscar (2 letras sin contar tildes ni signos). */
export function puedeBuscar(texto: string): boolean {
  return normalizarTexto(texto).length >= BUSQUEDA_MIN_CARACTERES;
}

export function useBusquedaDiccionario(texto: string, limite?: number) {
  return useQuery({
    queryKey: ['diccionario', 'buscar', normalizarTexto(texto), limite],
    queryFn: () => buscarEnDiccionario(texto, limite),
    enabled: puedeBuscar(texto),
    placeholderData: keepPreviousData,
  });
}

export function useValorConEspera<T>(valor: T, ms: number): T {
  const [conEspera, setConEspera] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setConEspera(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return conEspera;
}

let cache = leerRecientes();
let firma = JSON.stringify(cache);

function instantanea() {
  const actual = leerRecientes();
  const nueva = JSON.stringify(actual);
  if (nueva !== firma) {
    cache = actual;
    firma = nueva;
  }
  return cache;
}

export function useRecientes() {
  const recientes = useSyncExternalStore(suscribirRecientes, instantanea);
  return { recientes, borrar: borrarRecientes };
}
