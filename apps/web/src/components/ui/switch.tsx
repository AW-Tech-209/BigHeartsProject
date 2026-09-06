import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Interruptor de sí/no. Sobre Base UI: renderiza el `<input>` oculto que le da
 * semántica de formulario, y el anillo de foco lo aplica la regla global
 * `:focus-visible` (`index.css`), igual que `<Input>` y `<Button>`.
 */
export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-muted p-0.5',
        'transition-colors data-[checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-card shadow-sm transition-transform data-[checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}

type SwitchFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Ícono de lucide: la mitad no cromática de la codificación triple. */
  icon: LucideIcon;
  className?: string;
};

/**
 * Un interruptor con su `<label>` visible, para un filtro de sí/no («Solo mis
 * clases»). Mismo objetivo táctil y misma regla de foco que `<CheckboxField>`
 * — es la variante visual, no una decisión de accesibilidad distinta.
 *
 * Sin `htmlFor`: Base UI ya asocia el `<label>` que envuelve al interruptor
 * por `aria-labelledby` (el interruptor visible, no el `<input>` oculto que
 * solo existe para el envío del formulario). Ponerlo duplicaría el nombre
 * accesible en dos elementos distintos.
 */
export function SwitchField({
  id,
  label,
  checked,
  onChange,
  icon: Icon,
  className,
}: SwitchFieldProps) {
  return (
    <label
      className={cn(
        'flex min-h-11 w-fit cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-colors',
        'hover:border-input',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        className,
      )}
    >
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Icon
        aria-hidden="true"
        strokeWidth={2}
        className={cn('size-5 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')}
      />
      <span className="text-base text-foreground">{label}</span>
    </label>
  );
}
