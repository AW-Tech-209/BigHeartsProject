import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '@/lib/utils';

/**
 * Regla de 1px. Sobre Base UI para heredar `role="separator"` y la orientación
 * accesible: un `<div>` con borde no le dice nada a un lector de pantalla.
 *
 * Solo separa bloques que ya están separados por espacio. Una regla que sustituye
 * al aire no organiza nada, solo añade una línea.
 */
export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}
