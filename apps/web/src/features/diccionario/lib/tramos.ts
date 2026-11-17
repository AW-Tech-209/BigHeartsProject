import { TramoModulo } from '@academia/types';
import { type LucideIcon, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';

type EstiloTramo = {
  icono: LucideIcon;
  /** Riel de 4px a la izquierda de toda tarjeta del diccionario. */
  riel: string;
  texto: string;
  borde: string;
};

export const ESTILO_TRAMO: Record<TramoModulo, EstiloTramo> = {
  [TramoModulo.BASICO]: {
    icono: SignalLow,
    riel: 'border-l-4 border-l-accent-indigo',
    texto: 'text-accent-indigo',
    borde: 'border-accent-indigo/40',
  },
  [TramoModulo.INTERMEDIO]: {
    icono: SignalMedium,
    riel: 'border-l-4 border-l-accent-teal',
    texto: 'text-accent-teal',
    borde: 'border-accent-teal/40',
  },
  [TramoModulo.AVANZADO]: {
    icono: SignalHigh,
    riel: 'border-l-4 border-l-accent-rose',
    texto: 'text-accent-rose',
    borde: 'border-accent-rose/40',
  },
};

export const ORDEN_TRAMOS = [TramoModulo.BASICO, TramoModulo.INTERMEDIO, TramoModulo.AVANZADO];
