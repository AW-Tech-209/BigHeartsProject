import { CommunicationPreference } from '@academia/types';
import { Eye, Hand, Type, Volume2, type LucideIcon } from 'lucide-react';

import { communicationPreferenceLabels } from '@/features/auth/lib/accessibility-labels';

/**
 * Ícono de cada modo de comunicación (HU-211). El texto NO se duplica aquí:
 * viene de `communicationPreferenceLabels` (`features/auth/lib/accessibility-labels.ts`),
 * la misma etiqueta que ya usa el perfil del estudiante — es a propósito el
 * mismo vocabulario en los dos lados del emparejamiento.
 *
 * Íconos literales, no decorativos: una mano para lengua de señas, un ojo
 * para lectura labial, la letra para texto escrito, el altavoz para audio.
 */
export const iconoModoComunicacion: Record<CommunicationPreference, LucideIcon> = {
  [CommunicationPreference.SIGN_LANGUAGE]: Hand,
  [CommunicationPreference.LIP_READING]: Eye,
  [CommunicationPreference.WRITTEN_TEXT]: Type,
  [CommunicationPreference.SPOKEN_AUDIO]: Volume2,
};

/** Los cuatro modos, en el orden en que se declaran — es el orden canónico
 * que decide cuál se muestra como "modo principal" cuando un aula tiene
 * varios (`<TarjetaAula>`, T10). */
export const MODOS_COMUNICACION_EN_ORDEN: CommunicationPreference[] = [
  CommunicationPreference.SIGN_LANGUAGE,
  CommunicationPreference.LIP_READING,
  CommunicationPreference.WRITTEN_TEXT,
  CommunicationPreference.SPOKEN_AUDIO,
];

export { communicationPreferenceLabels as etiquetaModoComunicacion };
