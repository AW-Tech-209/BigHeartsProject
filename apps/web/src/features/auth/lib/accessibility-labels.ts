import {
  CommunicationPreference,
  HearingLossLevel,
  type RegisterableRole,
  UserRole,
} from '@academia/types';
import { GraduationCap, Presentation } from 'lucide-react';

import type { RadioCardOption } from '@/components/ui/radio-card-group';

/** Opciones del selector de rol (solo estudiante o profesor). */
export const roleOptions: RadioCardOption<RegisterableRole>[] = [
  {
    value: UserRole.STUDENT,
    label: 'Estudiante',
    description: 'Quiero aprender inglés en la plataforma.',
    icon: GraduationCap,
  },
  {
    value: UserRole.TEACHER,
    label: 'Profesor',
    description: 'Quiero impartir clases en la plataforma.',
    icon: Presentation,
  },
];

/** Etiquetas en español del nivel de hipoacusia. */
export const hearingLossLevelLabels: Record<HearingLossLevel, string> = {
  [HearingLossLevel.NONE]: 'Sin pérdida auditiva',
  [HearingLossLevel.MILD]: 'Leve',
  [HearingLossLevel.MODERATE]: 'Moderada',
  [HearingLossLevel.SEVERE]: 'Severa',
  [HearingLossLevel.PROFOUND]: 'Profunda',
};

/**
 * La preferencia del estudiante con el vocabulario del aula (HU-507, D44): el
 * valor guardado sigue siendo `CommunicationPreference`, pero se pregunta en
 * términos de modo de instrucción y apoyos.
 */
export const communicationPreferenceLabels: Record<CommunicationPreference, string> = {
  [CommunicationPreference.SIGN_LANGUAGE]: 'Clases impartidas en Lengua de Señas Colombiana (LSC)',
  [CommunicationPreference.LIP_READING]: 'Lectura labial como apoyo',
  [CommunicationPreference.WRITTEN_TEXT]: 'Texto escrito como apoyo',
  [CommunicationPreference.SPOKEN_AUDIO]: 'Audio con apoyo',
};

/** Las que se ofrecen: `SPOKEN_AUDIO` ya no existe en el vocabulario del aula (D43). */
export const PREFERENCIAS_OFRECIDAS: CommunicationPreference[] = [
  CommunicationPreference.SIGN_LANGUAGE,
  CommunicationPreference.LIP_READING,
  CommunicationPreference.WRITTEN_TEXT,
];

export const ETIQUETA_PREFERENCIA = 'Cómo prefieres seguir las clases';
export const AYUDA_PREFERENCIA =
  'Con ella destacamos las clases que coinciden contigo. Nunca te ocultamos ninguna.';

/** Etiqueta legible del rol, para los mensajes de confirmación. */
export const roleLabels: Record<RegisterableRole, string> = {
  [UserRole.STUDENT]: 'estudiante',
  [UserRole.TEACHER]: 'profesor',
};
