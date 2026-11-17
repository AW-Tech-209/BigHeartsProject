import {
  ESTADO_SENA_ADMIN_LABELS,
  type EstadoSena as EstadoSenaEstudiante,
  type EstadoSenaAdmin,
} from '@academia/types';
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock,
  Hand,
  Hourglass,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type Tono = 'success' | 'neutral' | 'attention' | 'destructive';

const ESTUDIANTE: Record<EstadoSenaEstudiante, { icono: LucideIcon; tono: Tono; texto: string }> = {
  lista: { icono: Hand, tono: 'success', texto: 'Seña lista' },
  'en-preparacion': { icono: Clock, tono: 'neutral', texto: 'Seña en preparación' },
};

// Ámbar solo en «Procesando»: es tiempo, lo único que el ámbar significa.
const ADMIN: Record<EstadoSenaAdmin, { icono: LucideIcon; tono: Tono }> = {
  lista: { icono: CircleCheck, tono: 'success' },
  procesando: { icono: Hourglass, tono: 'attention' },
  error: { icono: CircleAlert, tono: 'destructive' },
  'sin-sena': { icono: CircleDashed, tono: 'neutral' },
};

type EstadoSenaProps =
  | { vista: 'estudiante'; estado: EstadoSenaEstudiante; className?: string }
  | { vista: 'admin'; estado: EstadoSenaAdmin; className?: string };

export function EstadoSena(props: EstadoSenaProps) {
  const { icono, tono, texto } =
    props.vista === 'estudiante'
      ? ESTUDIANTE[props.estado]
      : { ...ADMIN[props.estado], texto: ESTADO_SENA_ADMIN_LABELS[props.estado] };

  return (
    <Badge tono={tono} icon={icono} className={props.className}>
      {texto}
    </Badge>
  );
}
