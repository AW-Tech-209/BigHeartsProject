import { CommunicationPreference } from '@academia/types';
import { Eye, Hand, Type, Volume2, type LucideIcon } from 'lucide-react';

/**
 * Copia local para la demo del catálogo: dice «Lengua de Señas Colombiana
 * (LSC)», no «Lengua de signos» (AC4). No se reutiliza `accessibility-labels.ts`
 * porque queda fuera de `features/landing/` y todavía no migró al vocabulario
 * de `InstructionMode` (HU-507, pendiente).
 */
export const ETIQUETA_MODO_LANDING: Record<CommunicationPreference, string> = {
  [CommunicationPreference.SIGN_LANGUAGE]: 'Lengua de Señas Colombiana (LSC)',
  [CommunicationPreference.LIP_READING]: 'Lectura labial',
  [CommunicationPreference.WRITTEN_TEXT]: 'Texto escrito',
  [CommunicationPreference.SPOKEN_AUDIO]: 'Audio con apoyo',
};

export const ICONO_MODO_LANDING: Record<CommunicationPreference, LucideIcon> = {
  [CommunicationPreference.SIGN_LANGUAGE]: Hand,
  [CommunicationPreference.LIP_READING]: Eye,
  [CommunicationPreference.WRITTEN_TEXT]: Type,
  [CommunicationPreference.SPOKEN_AUDIO]: Volume2,
};

export const MODOS_LANDING_EN_ORDEN: CommunicationPreference[] = [
  CommunicationPreference.SIGN_LANGUAGE,
  CommunicationPreference.LIP_READING,
  CommunicationPreference.WRITTEN_TEXT,
  CommunicationPreference.SPOKEN_AUDIO,
];
