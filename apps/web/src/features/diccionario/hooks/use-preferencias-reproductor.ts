import { useCallback, useState } from 'react';

export const VELOCIDADES = [0.5, 0.75, 1] as const;
export type Velocidad = (typeof VELOCIDADES)[number];

const CLAVE = 'bighearts:diccionario:reproductor';

type Preferencias = { velocidad: Velocidad; espejo: boolean };

const POR_DEFECTO: Preferencias = { velocidad: 1, espejo: false };

function leer(): Preferencias {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Preferencias>;
    return {
      velocidad: VELOCIDADES.includes(crudo.velocidad as Velocidad)
        ? (crudo.velocidad as Velocidad)
        : POR_DEFECTO.velocidad,
      espejo: crudo.espejo === true,
    };
  } catch {
    return POR_DEFECTO;
  }
}

/** Velocidad y espejo se recuerdan en este dispositivo, como el tema. */
export function usePreferenciasReproductor() {
  const [preferencias, setPreferencias] = useState(leer);

  const guardar = useCallback((cambio: Partial<Preferencias>) => {
    setPreferencias((actual) => {
      const nuevas = { ...actual, ...cambio };
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nuevas));
      } catch {
        // Sin almacenamiento: la preferencia vale solo para esta visita.
      }
      return nuevas;
    });
  }, []);

  return { ...preferencias, guardar };
}

export function formatoVelocidad(velocidad: Velocidad): string {
  return `${velocidad}×`;
}
