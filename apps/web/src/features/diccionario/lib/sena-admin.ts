import type { EstadoSenaAdmin } from '@academia/types';
import { CircleAlert, CircleCheck, CircleDashed, Hourglass, type LucideIcon } from 'lucide-react';

type Tono = 'success' | 'neutral' | 'attention' | 'destructive';

// Ámbar solo en «Procesando»: es tiempo, lo único que el ámbar significa.
export const SENA_ADMIN: Record<EstadoSenaAdmin, { icono: LucideIcon; tono: Tono }> = {
  lista: { icono: CircleCheck, tono: 'success' },
  procesando: { icono: Hourglass, tono: 'attention' },
  error: { icono: CircleAlert, tono: 'destructive' },
  'sin-sena': { icono: CircleDashed, tono: 'neutral' },
};
