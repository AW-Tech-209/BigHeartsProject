import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { formatoMb } from '../lib/validar-video';

export type EstadoSubida = 'vacia' | 'validando' | 'subiendo' | 'procesando' | 'lista' | 'error';

export type Progreso = { subidos: number; total: number };

/** Lo que cada tipo de archivo hace con el núcleo: validar, pedir URLs, subir y confirmar. */
export type PasosSubida = (herramientas: {
  senal: AbortSignal;
  empezar: (total: number) => void;
  avanzar: (subidos: number) => void;
  procesando: () => void;
}) => Promise<void>;

const HITOS = 4;

/**
 * Núcleo común de las subidas: estado, progreso en MB, anuncios por hitos (no en cada byte),
 * cancelación y refresco de las consultas cuando el servidor confirma. Sin mutación optimista.
 */
export function useSubida() {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoSubida>('vacia');
  const [progreso, setProgreso] = useState<Progreso>({ subidos: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const control = useRef<AbortController | null>(null);
  const hito = useRef(-1);
  const total = useRef(0);

  useEffect(() => () => control.current?.abort(), []);

  const refrescar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-diccionario'] }),
      queryClient.invalidateQueries({ queryKey: ['diccionario'] }),
    ]);

  async function ejecutar(pasos: PasosSubida) {
    control.current?.abort();
    const ctrl = new AbortController();
    control.current = ctrl;
    setError(null);
    setEstado('validando');
    hito.current = -1;

    const avanzar = (subidos: number) => {
      setProgreso({ subidos, total: total.current });
      const actual = Math.floor((subidos / Math.max(total.current, 1)) * HITOS);
      if (actual !== hito.current) {
        hito.current = actual;
        setAnuncio(`${formatoMb(subidos)} de ${formatoMb(total.current)} subidos.`);
      }
    };

    try {
      await pasos({
        senal: ctrl.signal,
        empezar: (bytes) => {
          total.current = bytes;
          setEstado('subiendo');
          avanzar(0);
        },
        avanzar,
        procesando: () => {
          avanzar(total.current);
          setEstado('procesando');
          setAnuncio('Procesando…');
        },
      });
      if (ctrl.signal.aborted) throw new DOMException('Subida cancelada', 'AbortError');
      setEstado('lista');
      setAnuncio('Lista.');
      await refrescar();
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setEstado('vacia');
        setAnuncio('Subida cancelada.');
      } else {
        const motivo =
          e instanceof Error ? e.message : 'No pudimos subir el archivo. Inténtalo de nuevo.';
        setEstado('error');
        setError(motivo);
        setAnuncio(motivo);
      }
      return false;
    } finally {
      if (control.current === ctrl) control.current = null;
    }
  }

  /** Errores de validación: se dicen sin haber tocado la red. */
  function rechazar(motivo: string) {
    setEstado('error');
    setError(motivo);
    setAnuncio(motivo);
  }

  return {
    estado,
    progreso,
    error,
    anuncio,
    ejecutar,
    rechazar,
    refrescar,
    cancelar: () => control.current?.abort(),
    reiniciar: () => {
      setEstado('vacia');
      setError(null);
    },
    ocupada: estado === 'validando' || estado === 'subiendo' || estado === 'procesando',
  };
}
