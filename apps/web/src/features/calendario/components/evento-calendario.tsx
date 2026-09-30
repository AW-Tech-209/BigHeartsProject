import { InstructionMode, type ClassroomListItem } from '@academia/types';
import { Link } from 'react-router-dom';

import { EstadoAula, textoEstadoAula } from '@/components/dominio/estado-aula';
import {
  varianteEstadoAula,
  type VarianteEstadoAula,
} from '@/components/dominio/estado-aula-variantes';
import { IndicadorCupo } from '@/components/dominio/indicador-cupo';
import { ModoInstruccion } from '@/components/dominio/modo-instruccion';
import { describirHorarioPartes, describirHorarioRenglon } from '@/features/aulas/lib/horario';
import { iconoModoInstruccion } from '@/features/aulas/lib/accesibilidad-aula';
import { cn } from '@/lib/utils';

import { estadoEnCalendario } from '../lib/estado';

export type AulaEnCalendario = Pick<
  ClassroomListItem,
  | 'id'
  | 'title'
  | 'scheduledAt'
  | 'durationMinutes'
  | 'status'
  | 'currentBookings'
  | 'maxStudents'
  | 'instructionMode'
> &
  Partial<Pick<ClassroomListItem, 'myBookingStatus'>>;

export type Rol = 'estudiante' | 'profesor';

const MODO_CORTO: Record<InstructionMode, string> = {
  [InstructionMode.LSC_NATIVA]: 'En LSC',
  [InstructionMode.INTERPRETE_LSC]: 'Con intérprete',
};

const BLOQUE: Record<VarianteEstadoAula['tono'], string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  primary: 'border-primary/40 bg-primary-soft text-primary-soft-foreground',
  success: 'border-success-border bg-success-soft text-success-soft-foreground',
  attention: 'border-attention-border bg-attention-soft text-attention-soft-foreground',
  destructive: 'border-destructive-border bg-destructive-soft text-destructive-soft-foreground',
  info: 'border-info/30 bg-info-soft text-info-soft-foreground',
};

/** Borde pleno de los dos estados sólidos: «hay algo que hacer ahora». */
const BORDE_SOLIDO: Partial<Record<VarianteEstadoAula['tono'], string>> = {
  success: 'border-2 border-success',
  attention: 'border-2 border-attention',
};

function bordeSolido(variante: VarianteEstadoAula): string | false {
  return variante.enfasis === 'solido' && (BORDE_SOLIDO[variante.tono] ?? 'border-2');
}

function horas(aula: AulaEnCalendario) {
  const fin = new Date(new Date(aula.scheduledAt).getTime() + aula.durationMinutes * 60_000);
  return {
    inicio: describirHorarioRenglon(aula.scheduledAt).hora,
    fin: describirHorarioRenglon(fin.toISOString()).hora,
  };
}

/** Una clase dentro de la rejilla horaria: su alto es su duración. */
export function BloqueCalendario({ aula, ahora }: { aula: AulaEnCalendario; ahora: Date }) {
  const estado = estadoEnCalendario(aula, ahora);
  const variante = varianteEstadoAula[estado];
  const IconoEstado = variante.icon;
  const IconoModo = aula.instructionMode ? iconoModoInstruccion[aula.instructionMode] : null;
  const { inicio, fin } = horas(aula);
  const { cuando } = describirHorarioPartes(aula.scheduledAt);

  return (
    <Link
      to={`/aulas/${aula.id}`}
      aria-label={`${cuando}: ${aula.title}`}
      className={cn(
        'transicion-rapida flex h-full flex-col gap-0.5 overflow-hidden rounded-lg border px-2 py-1.5 text-xs hover:shadow-md',
        BLOQUE[variante.tono],
        bordeSolido(variante),
      )}
    >
      <span className="truncate tabular-nums">
        {inicio} – {fin}
      </span>
      <span className="line-clamp-2 text-sm leading-snug font-semibold">{aula.title}</span>
      <span className="flex items-center gap-1 font-medium">
        <IconoEstado aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
        <span className="truncate">{textoEstadoAula(estado)}</span>
      </span>
      {IconoModo && aula.instructionMode && (
        <span className="flex items-center gap-1">
          <IconoModo aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
          <span className="truncate">{MODO_CORTO[aula.instructionMode]}</span>
        </span>
      )}
    </Link>
  );
}

/** Una clase en la agenda del día (móvil): hora a la izquierda, datos a la derecha. */
export function TarjetaClaseDia({
  aula,
  ahora,
  rol,
}: {
  aula: AulaEnCalendario;
  ahora: Date;
  rol: Rol;
}) {
  const estado = estadoEnCalendario(aula, ahora);
  const { inicio, fin } = horas(aula);
  const { cuando } = describirHorarioPartes(aula.scheduledAt);
  const pasada = estado === 'finalizada' || estado === 'cancelada';

  return (
    <Link
      to={`/aulas/${aula.id}`}
      aria-label={`${cuando}: ${aula.title}`}
      className={cn(
        'transicion-rapida flex gap-4 rounded-xl border bg-card p-4 shadow-xs hover:border-foreground/30',
        bordeSolido(varianteEstadoAula[estado]) || 'border-border',
      )}
    >
      <span className="flex w-20 shrink-0 flex-col tabular-nums text-muted-foreground">
        <span className="text-base font-semibold text-foreground">{inicio}</span>
        <span className="text-sm">a {fin}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <span className={cn('font-semibold', pasada ? 'text-muted-foreground' : 'text-foreground')}>
          {aula.title}
        </span>
        <EstadoAula estado={estado} />
        <ModoInstruccion modo={aula.instructionMode} />
        {rol === 'profesor' && (
          <IndicadorCupo
            variante="inscritos"
            maxStudents={aula.maxStudents}
            currentBookings={aula.currentBookings}
          />
        )}
      </span>
    </Link>
  );
}
