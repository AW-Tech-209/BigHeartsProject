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

/** Etiquetas en español de la preferencia de comunicación. */
export const communicationPreferenceLabels: Record<CommunicationPreference, string> = {
  [CommunicationPreference.SIGN_LANGUAGE]: 'Lengua de signos',
  [CommunicationPreference.LIP_READING]: 'Lectura labial',
  [CommunicationPreference.WRITTEN_TEXT]: 'Texto escrito',
  [CommunicationPreference.SPOKEN_AUDIO]: 'Audio con apoyo',
};

/** Etiqueta legible del rol, para los mensajes de confirmación. */
export const roleLabels: Record<RegisterableRole, string> = {
  [UserRole.STUDENT]: 'estudiante',
  [UserRole.TEACHER]: 'profesor',
};
