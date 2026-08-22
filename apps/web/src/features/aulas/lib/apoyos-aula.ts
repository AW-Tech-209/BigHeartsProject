import { Captions, Image, Languages, type LucideIcon } from 'lucide-react';

/**
 * Los tres apoyos de un aula (HU-211, decisión 2): campos APARTE del modo de
 * comunicación. Una clase en inglés hablado CON intérprete de señas no es lo
 * mismo que una impartida directamente en señas.
 */
export type ClaveApoyoAula = 'hasInterpreter' | 'hasLiveCaptions' | 'hasVisualMaterials';

export const APOYOS_AULA: { clave: ClaveApoyoAula; etiqueta: string; icon: LucideIcon }[] = [
  { clave: 'hasInterpreter', etiqueta: 'Intérprete de lengua de señas', icon: Languages },
  { clave: 'hasLiveCaptions', etiqueta: 'Subtítulos en vivo', icon: Captions },
  { clave: 'hasVisualMaterials', etiqueta: 'Materiales visuales de apoyo', icon: Image },
];
