import type { InstructionMode } from '@academia/types';
import { CircleHelp } from 'lucide-react';

import {
  etiquetaModoInstruccion,
  iconoModoInstruccion,
} from '@/features/aulas/lib/accesibilidad-aula';
import { cn } from '@/lib/utils';

type ModoInstruccionProps = {
  /** `null`: el profesor no lo ha declarado (regla 3 de §4.9). */
  modo: InstructionMode | null;
  tamano?: 'compacto' | 'destacado';
  className?: string;
};

/**
 * En qué lengua se imparte la clase (HU-507, nivel 1). No es un chip más: va
 * en su propia línea, con más peso que los apoyos, y nunca comparte fila con ellos.
 * Sin modo declarado se dice tal cual; no se disfraza de ninguno de los dos.
 */
export function ModoInstruccion({ modo, tamano = 'compacto', className }: ModoInstruccionProps) {
  const Icon = modo ? iconoModoInstruccion[modo] : CircleHelp;
  const destacado = tamano === 'destacado';

  return (
    <div
      role="group"
      aria-label="Modo de instrucción"
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-lg border font-medium',
        destacado ? 'px-3.5 py-2.5 text-base' : 'px-2.5 py-1 text-sm',
        modo
          ? 'border-info/30 bg-info-soft text-info-soft-foreground'
          : 'border-dashed border-input bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={2}
        className={cn('shrink-0', destacado ? 'size-5' : 'size-4')}
      />
      <span className="min-w-0 text-pretty">
        {modo ? etiquetaModoInstruccion[modo] : 'Modo de instrucción sin declarar'}
      </span>
    </div>
  );
}
