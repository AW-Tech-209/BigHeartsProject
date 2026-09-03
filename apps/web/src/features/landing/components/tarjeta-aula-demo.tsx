import { UMBRAL_ULTIMOS_CUPOS } from '@academia/types';

import { EstadoAula } from '@/components/dominio/estado-aula';
import {
  varianteEstadoAula,
  type EstadoAula as EstadoAulaTipo,
} from '@/components/dominio/estado-aula-variantes';
import { IndicadorCupo } from '@/components/dominio/indicador-cupo';
import { ModoComunicacionBadge } from '@/components/dominio/modo-comunicacion-badge';
import { MODOS_COMUNICACION_EN_ORDEN } from '@/features/aulas/lib/modos-comunicacion';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { cn } from '@/lib/utils';
import type { AulaDemo } from '../lib/aulas-demo';

/**
 * El estado de cupo de un aula de ejemplo. Solo depende de cuántos lugares
 * quedan —no hay fechas reales que evaluar en la demostración—, así que se
 * calcula con el mismo umbral que usa el producto en lugar de montar
 * `derivarEstadoAula`.
 */
function estadoDeCupo(aula: AulaDemo): EstadoAulaTipo {
  const libres = aula.maxStudents - aula.currentBookings;
  if (libres <= 0) return 'llena';
  if (libres <= UMBRAL_ULTIMOS_CUPOS) return 'ultimos-cupos';
  return 'disponible';
}

/**
 * Versión de solo lectura de `<TarjetaAula>` para la demostración de la landing:
 * conserva el riel de 4px, la codificación triple del estado y el conteo
 * literal de cupos, pero no navega a ningún sitio (no hay aula real detrás).
 */
export function TarjetaAulaDemo({
  aula,
  rielAnimado = false,
}: {
  aula: AulaDemo;
  /** Anima el crecimiento del riel al aparecer (solo la tarjeta del hero). */
  rielAnimado?: boolean;
}) {
  const estado = estadoDeCupo(aula);
  const libres = Math.max(aula.maxStudents - aula.currentBookings, 0);
  const tituloId = `aula-demo-${aula.id}`;
  const modos = MODOS_COMUNICACION_EN_ORDEN.filter((modo) => aula.modos.includes(modo));

  return (
    <article
      aria-labelledby={tituloId}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          rielAnimado && 'riel-entra',
          varianteEstadoAula[estado].riel,
        )}
      />

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{aula.fecha}</p>
        <h3 id={tituloId} className="text-base font-medium text-foreground">
          {aula.titulo}
        </h3>
        <p className="text-[13px] text-muted-foreground">
          {aula.profesor} · {nivelesDeIngles[aula.nivel].nombre}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <EstadoAula estado={estado} cuposRestantes={libres} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1" aria-label="Formas de comunicación">
          {modos.map((modo) => (
            <ModoComunicacionBadge key={modo} modo={modo} className="px-2 py-0.5 text-xs" />
          ))}
        </div>

        <IndicadorCupo
          variante="cupos"
          maxStudents={aula.maxStudents}
          currentBookings={aula.currentBookings}
          className="mt-1 flex"
        />
      </div>
    </article>
  );
}
