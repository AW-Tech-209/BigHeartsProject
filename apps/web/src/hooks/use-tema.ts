import { useCallback, useState } from 'react';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'bighearts:tema';

function aplicarClase(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro');
}

function leerTemaGuardado(): Tema {
  try {
    return localStorage.getItem(CLAVE) === 'oscuro' ? 'oscuro' : 'claro';
  } catch {
    return 'claro';
  }
}

/**
 * Tema visual del navegador (claro/oscuro). Es preferencia de ESTE navegador,
 * no de la cuenta: `localStorage`, sin endpoint ni columna en `User` (HU-216).
 */
export function useTema() {
  const [tema, setTemaState] = useState<Tema>(leerTemaGuardado);

  const alternar = useCallback(() => {
    setTemaState((actual) => {
      const siguiente: Tema = actual === 'claro' ? 'oscuro' : 'claro';
      aplicarClase(siguiente);
      try {
        localStorage.setItem(CLAVE, siguiente);
      } catch {
        // Si no persiste, el próximo arranque vuelve a claro; no rompe la pantalla actual.
      }
      return siguiente;
    });
  }, []);

  return { tema, alternar };
}
