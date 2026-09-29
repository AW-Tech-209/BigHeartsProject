import { useCallback, useSyncExternalStore } from 'react';

export type TamanoTexto = 'normal' | 'grande' | 'muy-grande';

export const TAMANOS_TEXTO: TamanoTexto[] = ['normal', 'grande', 'muy-grande'];

const CLAVE = 'bighearts:tamano-texto';
const CLASES: Record<TamanoTexto, string | null> = {
  normal: null,
  grande: 'texto-grande',
  'muy-grande': 'texto-muy-grande',
};

function leerGuardado(): TamanoTexto {
  try {
    const valor = localStorage.getItem(CLAVE);
    return TAMANOS_TEXTO.includes(valor as TamanoTexto) ? (valor as TamanoTexto) : 'normal';
  } catch {
    return 'normal';
  }
}

function aplicarClase(tamano: TamanoTexto) {
  const { classList } = document.documentElement;
  classList.remove('texto-grande', 'texto-muy-grande');
  const clase = CLASES[tamano];
  if (clase) classList.add(clase);
}

let actual: TamanoTexto = leerGuardado();
const oyentes = new Set<() => void>();

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/**
 * Tamaño de texto de ESTE navegador (`localStorage`, sin servidor). Un store de módulo
 * mantiene sincronizadas todas las instancias del selector en la misma pantalla.
 */
export function useTamanoTexto() {
  const tamano = useSyncExternalStore(suscribir, () => actual);

  const elegir = useCallback((siguiente: TamanoTexto) => {
    actual = siguiente;
    aplicarClase(siguiente);
    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      // Sin almacenamiento, la elección rige en esta sesión y el próximo arranque vuelve a Normal.
    }
    oyentes.forEach((oyente) => oyente());
  }, []);

  return { tamano, elegir };
}
