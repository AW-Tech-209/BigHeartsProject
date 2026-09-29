import { ProblemaClase, SeguimientoClase } from '@academia/types';
import { CircleCheck, CircleMinus, CircleX, type LucideIcon } from 'lucide-react';

export const OPCIONES_SEGUIMIENTO: { valor: SeguimientoClase; texto: string; icono: LucideIcon }[] =
  [
    { valor: SeguimientoClase.SI, texto: 'Sí', icono: CircleCheck },
    { valor: SeguimientoClase.A_MEDIAS, texto: 'A medias', icono: CircleMinus },
    { valor: SeguimientoClase.NO, texto: 'No', icono: CircleX },
  ];

export const TEXTO_PROBLEMA: Record<ProblemaClase, string> = {
  [ProblemaClase.INTERPRETE]: 'El intérprete',
  [ProblemaClase.SUBTITULOS]: 'Los subtítulos',
  [ProblemaClase.CONEXION]: 'La conexión',
  [ProblemaClase.RITMO]: 'El ritmo de la clase',
  [ProblemaClase.OTRO]: 'Otra cosa',
};

export const MENSAJE_GRACIAS = 'Gracias. Se lo contamos al profesor sin decir tu nombre.';
