import { Users } from 'lucide-react';

import { describirCuposRestantes } from '@/features/aulas/lib/cupos';
import { cn } from '@/lib/utils';
import { UMBRAL_ULTIMOS_CUPOS } from '@academia/types';

/**
 * Las dos lecturas del mismo par de números.
 *
 * - `cupos` — **cuánto queda**. Es la pregunta del estudiante: decide si le da
 *   tiempo a reservar.
 * - `inscritos` — **cuánta gente viene**. Es la pregunta del profesor en «Mis
 *   aulas» (HU-207, B3): que queden ocho lugares no le dice nada que no le diga
 *   mejor «2 de 10 inscritos», y sí le esconde el dato que sí le importa.
 *
 * Es una variante y no un componente aparte a propósito: los dos textos salen
 * de los mismos dos campos, y duplicarlo garantizaría que un día digan cosas
 * distintas del mismo aula.
 */
export type VarianteIndicadorCupo = 'cupos' | 'inscritos';

type IndicadorCupoProps = {
  maxStudents: number;
  currentBookings: number;
  variante?: VarianteIndicadorCupo;
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
 * `<TarjetaAula>` — que en el catálogo comunica el cupo a través de
 * `<EstadoAula>` (`disponible`/`ultimos-cupos`/`llena`) sin duplicar el
 * mensaje, y en «Mis aulas» usa este componente en su variante `inscritos`.
 * Queda listo también para el detalle de aula (HU-204) y el flujo de reserva.
 */
export function IndicadorCupo({
  maxStudents,
  currentBookings,
  variante = 'cupos',
  className,
}: IndicadorCupoProps) {
  const disponibles = Math.max(maxStudents - currentBookings, 0);

  /*
    En `inscritos` el tono es neutro, y no es un olvido: el color de este
    producto significa algo (`SKILL.md`, diccionario de color), y «cuánta gente
    viene» no es ni una urgencia ni un logro. Pintar de ámbar una clase con
    pocos inscritos le inventaría al profesor una alarma que nadie decidió.
  */
  const tono =
    variante === 'inscritos'
      ? 'muted'
      : disponibles === 0
        ? 'muted'
        : disponibles <= UMBRAL_ULTIMOS_CUPOS
          ? 'attention'
          : 'success';

  const texto =
    variante === 'inscritos'
      ? `${currentBookings} de ${maxStudents} inscritos`
      : disponibles === 0
        ? 'Sin cupos disponibles'
        : `${currentBookings} de ${maxStudents} lugares ocupados · ${describirCuposRestantes(disponibles)}`;

  const valueText =
    variante === 'inscritos'
      ? `${currentBookings} de ${maxStudents} inscritos`
      : disponibles === 0
        ? 'Sin cupos disponibles'
        : `Quedan ${disponibles} de ${maxStudents} lugares`;

  return (
    <div
      role="progressbar"
      aria-label={variante === 'inscritos' ? 'Estudiantes inscritos' : 'Cupo del aula'}
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
