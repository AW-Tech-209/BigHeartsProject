import { useEffect } from 'react';
import { create } from 'zustand';

type ContextoAyudaState = {
  /** Título de la clase que la pantalla actual tiene abierta, si hay una. */
  clase: string | null;
  setClase: (clase: string | null) => void;
};

export const useContextoAyudaStore = create<ContextoAyudaState>((set) => ({
  clase: null,
  setClase: (clase) => set({ clase }),
}));

/** La pantalla que muestra una clase la declara aquí para el mensaje de ayuda. */
export function useClaseParaAyuda(titulo: string | undefined) {
  const setClase = useContextoAyudaStore((s) => s.setClase);
  useEffect(() => {
    setClase(titulo ?? null);
    return () => setClase(null);
  }, [titulo, setClase]);
}
