import { Check } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/utils';

type ChipFiltroProps = {
  activo: boolean;
  conteo: number;
  onClick: () => void;
  children: ReactNode;
};

/** Seleccionado = fondo propio + borde + ✓; nunca solo el color. */
export function ChipFiltro({ activo, conteo, onClick, children }: ChipFiltroProps) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-4 py-1.5 text-left text-base transicion-rapida',
        activo
          ? 'border-primary bg-primary-soft font-medium text-primary-soft-foreground'
          : 'border-border bg-background hover:bg-muted',
      )}
    >
      {activo && <Check aria-hidden="true" strokeWidth={2.5} className="size-4 shrink-0" />}
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
      <span className={cn('shrink-0', !activo && 'text-muted-foreground')}>{conteo}</span>
    </button>
  );
}

type GrupoFiltrosProps = {
  titulo: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
};

export function GrupoFiltros({ titulo, ayuda, children, className }: GrupoFiltrosProps) {
  const id = useId();
  return (
    <div className={cn('space-y-2', className)}>
      <p id={`${id}-titulo`} className="text-base font-medium">
        {titulo}
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className="flex flex-wrap gap-2"
      >
        {children}
      </div>
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">
          {ayuda}
        </p>
      )}
    </div>
  );
}
