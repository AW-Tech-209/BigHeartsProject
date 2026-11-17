import {
  ESTADO_SENA_ADMIN_LABELS,
  type EstadoSena as EstadoSenaEstudiante,
  type EstadoSenaAdmin,
} from '@academia/types';
import { Clapperboard, Hand, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { SENA_ADMIN } from '../lib/sena-admin';

type Tono = 'success' | 'neutral' | 'attention' | 'destructive';

const ESTUDIANTE: Record<EstadoSenaEstudiante, { icono: LucideIcon; tono: Tono; texto: string }> = {
  lista: { icono: Hand, tono: 'success', texto: 'Seña lista' },
  'en-preparacion': { icono: Clapperboard, tono: 'neutral', texto: 'Seña en preparación' },
};

type EstadoSenaProps =
  | { vista: 'estudiante'; estado: EstadoSenaEstudiante; className?: string }
  | { vista: 'admin'; estado: EstadoSenaAdmin; className?: string };

export function EstadoSena(props: EstadoSenaProps) {
  const { icono, tono, texto } =
    props.vista === 'estudiante'
      ? ESTUDIANTE[props.estado]
      : { ...SENA_ADMIN[props.estado], texto: ESTADO_SENA_ADMIN_LABELS[props.estado] };

  return (
    <Badge tono={tono} icon={icono} className={props.className}>
      {texto}
    </Badge>
  );
}
