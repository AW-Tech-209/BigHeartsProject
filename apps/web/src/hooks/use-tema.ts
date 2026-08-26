import { useCallback, useState } from 'react';

export type Tema = 'claro' | 'oscuro' | 'alto-contraste';

export const TEMAS: Tema[] = ['claro', 'oscuro', 'alto-contraste'];

const CLAVE = 'bighearts:tema';
const CLASES_TEMA: Record<Tema, string[]> = {
  claro: [],
  oscuro: ['dark'],
  'alto-contraste': ['hc'],
};

function aplicarClase(tema: Tema) {
  document.documentElement.classList.remove('dark', 'hc');
  document.documentElement.classList.add(...CLASES_TEMA[tema]);
}

function leerTemaGuardado(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'alto-contraste') {
      return guardado;
    }
  } catch {
    // localStorage no disponible (modo privado, cuota agotada): se queda en claro.
  }
  return 'claro';
}

/**
 * Tema visual del navegador (claro/oscuro/alto contraste). Es preferencia de
 * ESTE navegador, no de la cuenta: `localStorage`, sin endpoint ni columna en
 * `User` (HU-216).
 */
export function useTema() {
  const [tema, setTemaState] = useState<Tema>(leerTemaGuardado);

  const setTema = useCallback((siguiente: Tema) => {
    setTemaState(siguiente);
    aplicarClase(siguiente);
    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      // Si no persiste, el próximo arranque vuelve a claro; no rompe la pantalla actual.
    }
  }, []);

  return { tema, setTema };
}
