import { TIPO_ENTRADA_LABELS, type TipoEntrada } from '@academia/types';

import { cn } from '@/lib/utils';

/** Palabra · Verbo · Frase · Expresión. Neutro: el tipo no es un estado. */
export function ChipTipo({ tipo, className }: { tipo: TipoEntrada; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-sm text-muted-foreground',
        className,
      )}
    >
      {TIPO_ENTRADA_LABELS[tipo]}
    </span>
  );
}
