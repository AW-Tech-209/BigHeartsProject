import {
  type AccessibilityPreference,
  ClassroomSupport,
  type CommunicationPreference,
  InstructionMode,
  MIGRACION_PREFERENCIA_COMUNICACION,
} from '@academia/types';
import { Captions, Eye, Hand, Image, Languages, Type, type LucideIcon } from 'lucide-react';

export {
  CLASSROOM_SUPPORT_LABELS as etiquetaApoyo,
  INSTRUCTION_MODE_LABELS as etiquetaModoInstruccion,
} from '@academia/types';

/** Una mano para la clase en LSC; el ícono de traducción para la que lleva intérprete. */
export const iconoModoInstruccion: Record<InstructionMode, LucideIcon> = {
  [InstructionMode.LSC_NATIVA]: Hand,
  [InstructionMode.INTERPRETE_LSC]: Languages,
};

export const MODOS_INSTRUCCION_EN_ORDEN: InstructionMode[] = [
  InstructionMode.LSC_NATIVA,
  InstructionMode.INTERPRETE_LSC,
];

/** Qué significa cada modo para quien lo elige al crear un aula (T3). */
export const descripcionModoInstruccion: Record<InstructionMode, string> = {
  [InstructionMode.LSC_NATIVA]: 'Impartes la clase directamente en LSC.',
  [InstructionMode.INTERPRETE_LSC]: 'La clase es hablada y un intérprete la traduce a LSC.',
};

export const iconoApoyo: Record<ClassroomSupport, LucideIcon> = {
  [ClassroomSupport.LIP_READING]: Eye,
  [ClassroomSupport.WRITTEN_TEXT]: Type,
  [ClassroomSupport.LIVE_CAPTIONS]: Captions,
  [ClassroomSupport.VISUAL_MATERIALS]: Image,
};

export const APOYOS_EN_ORDEN: ClassroomSupport[] = [
  ClassroomSupport.LIP_READING,
  ClassroomSupport.WRITTEN_TEXT,
  ClassroomSupport.LIVE_CAPTIONS,
  ClassroomSupport.VISUAL_MATERIALS,
];

/** Los apoyos del aula en orden canónico, no en el que los guardó el servidor. */
export function apoyosEnOrden(supports: ClassroomSupport[]): ClassroomSupport[] {
  return APOYOS_EN_ORDEN.filter((apoyo) => supports.includes(apoyo));
}

/**
 * La preferencia guardada del estudiante, traducida al vocabulario del aula
 * (D44). Mismo mapeo que usa el backend (`preferencia-accesibilidad.ts`).
 */
export function preferenciaAccesibilidadDe(
  preferencia: CommunicationPreference | null | undefined,
): AccessibilityPreference | null {
  return preferencia ? MIGRACION_PREFERENCIA_COMUNICACION[preferencia] : null;
}
