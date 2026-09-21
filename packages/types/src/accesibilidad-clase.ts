import { CommunicationPreference } from './index';

/**
 * Modo de instrucción de una clase (D42, `ARQUITECTURA.md` §4.9).
 *
 * Son DOS y no una lista a propósito: son experiencias pedagógicas distintas,
 * no niveles de una escala. `LSC_NATIVA` es la clase impartida directamente en
 * Lengua de Señas Colombiana; `INTERPRETE_LSC` es una clase hablada con
 * intérprete de LSC. El framework del socio (§2) es explícito en que
 * instrucción e interpretación no son intercambiables, así que fusionarlas en
 * un solo valor "con señas" borraría justo la distinción que esta HU existe
 * para declarar.
 */
export enum InstructionMode {
  LSC_NATIVA = 'LSC_NATIVA',
  INTERPRETE_LSC = 'INTERPRETE_LSC',
}

/** Etiquetas en español de `InstructionMode` (T7). Dice LSC, no "lengua de signos". */
export const INSTRUCTION_MODE_LABELS: Record<InstructionMode, string> = {
  [InstructionMode.LSC_NATIVA]: 'Lengua de Señas Colombiana (LSC)',
  [InstructionMode.INTERPRETE_LSC]: 'Con intérprete de Lengua de Señas Colombiana (LSC)',
};

/**
 * Apoyo opcional de una clase (D43). Nunca el método de instrucción, siempre
 * añadidura — el framework del socio (§3) prohíbe la lectura labial como
 * método principal, y aquí solo puede ser esto: un apoyo aparte.
 */
export enum ClassroomSupport {
  LIP_READING = 'LIP_READING',
  WRITTEN_TEXT = 'WRITTEN_TEXT',
  LIVE_CAPTIONS = 'LIVE_CAPTIONS',
  VISUAL_MATERIALS = 'VISUAL_MATERIALS',
}

/** Etiquetas en español de `ClassroomSupport` (T7). */
export const CLASSROOM_SUPPORT_LABELS: Record<ClassroomSupport, string> = {
  [ClassroomSupport.LIP_READING]: 'Lectura labial',
  [ClassroomSupport.WRITTEN_TEXT]: 'Texto escrito',
  [ClassroomSupport.LIVE_CAPTIONS]: 'Subtítulos en vivo',
  [ClassroomSupport.VISUAL_MATERIALS]: 'Materiales visuales',
};

/**
 * Preferencia de accesibilidad del estudiante (D44), reenfocada al mismo
 * vocabulario que declara el aula: qué instrucción prefiere y qué apoyos le
 * importan. Sustituye a `CommunicationPreference` como eje de emparejamiento
 * — ese enum sigue existiendo para lo que ya usa (perfil, registro), pero deja
 * de ser la vara con la que se compara un aula.
 */
export interface AccessibilityPreference {
  /** `null` si el estudiante no lo declaró. */
  instructionMode: InstructionMode | null;
  supports: ClassroomSupport[];
}

/**
 * Mapeo desde `CommunicationPreference` (el valor viejo) a `AccessibilityPreference`
 * (T3). Lo usa HU-506 para migrar los perfiles ya declarados. `SPOKEN_AUDIO`
 * desaparece del vocabulario del aula (D43): no tiene destino como instrucción
 * ni como apoyo, así que migra a "sin declarar".
 */
export const MIGRACION_PREFERENCIA_COMUNICACION: Record<
  CommunicationPreference,
  AccessibilityPreference
> = {
  [CommunicationPreference.SIGN_LANGUAGE]: {
    instructionMode: InstructionMode.LSC_NATIVA,
    supports: [],
  },
  [CommunicationPreference.LIP_READING]: {
    instructionMode: null,
    supports: [ClassroomSupport.LIP_READING],
  },
  [CommunicationPreference.WRITTEN_TEXT]: {
    instructionMode: null,
    supports: [ClassroomSupport.WRITTEN_TEXT],
  },
  [CommunicationPreference.SPOKEN_AUDIO]: {
    instructionMode: null,
    supports: [],
  },
};
