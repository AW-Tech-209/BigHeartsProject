import { Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { UMBRAL_ULTIMOS_CUPOS } from '@academia/types';

type IndicadorCupoProps = {
  maxStudents: number;
  currentBookings: number;
  className?: string;
};

const CLASE_POR_TONO = {
  success: 'text-success',
  attention: 'text-attention',
  muted: 'text-muted-foreground',
} as const;

/**
 * Conteo literal de cupos, nunca porcentaje ni gráfica circular
 * (`patrones-dominio.md`). Primitivo reusable e independiente de
 * `<TarjetaAula>` — que en esta HU comunica el cupo a través de
 * `<EstadoAula>` (`disponible`/`ultimos-cupos`/`llena`) sin duplicar el
 * mensaje; este componente queda listo para el detalle de aula (HU-204) y el
 * flujo de reserva, donde sí hace falta el desglose completo.
 */
export function IndicadorCupo({ maxStudents, currentBookings, className }: IndicadorCupoProps) {
  const disponibles = Math.max(maxStudents - currentBookings, 0);
  const tono =
    disponibles === 0 ? 'muted' : disponibles <= UMBRAL_ULTIMOS_CUPOS ? 'attention' : 'success';

  const texto =
    disponibles === 0
      ? 'Sin cupos disponibles'
      : `${currentBookings} de ${maxStudents} lugares ocupados · Quedan ${disponibles}`;

  const valueText =
    disponibles === 0 ? 'Sin cupos disponibles' : `Quedan ${disponibles} de ${maxStudents} lugares`;

  return (
    <div
      role="progressbar"
      aria-label="Cupo del aula"
      aria-valuemin={0}
      aria-valuemax={maxStudents}
      aria-valuenow={currentBookings}
      aria-valuetext={valueText}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        CLASE_POR_TONO[tono],
        className,
      )}
    >
      <Users aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
      <span>{texto}</span>
    </div>
  );
}
