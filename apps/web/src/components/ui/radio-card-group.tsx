import { Check, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type RadioCardOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon: LucideIcon;
};

type RadioCardGroupProps<T extends string> = {
  /** `name` del grupo de radios nativos. */
  name: string;
  /** Etiqueta accesible del grupo (id del texto que lo titula). */
  labelledBy: string;
  options: RadioCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Selector tipo tarjeta construido sobre radios NATIVOS (navegación por flechas
 * y semántica de "radio button" gratis). El estado seleccionado se comunica por
 * triple codificación: color (borde/fondo primary) + ícono (Check) + el estado
 * semántico del propio radio.
 */
export function RadioCardGroup<T extends string>({
  name,
  labelledBy,
  options,
  value,
  onChange,
  className,
}: RadioCardGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn('grid gap-3 sm:grid-cols-2', className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;

        return (
          <label
            key={option.value}
            className={cn(
              'relative flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-colors',
              'hover:border-input',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              selected ? 'border-primary bg-primary-soft' : 'border-border',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            <Icon
              aria-hidden="true"
              strokeWidth={2}
              className={cn(
                'mt-0.5 size-6 shrink-0',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            />

            <span className="flex-1">
              <span className="block font-medium text-foreground">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>

            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
              )}
            >
              {selected && <Check strokeWidth={3} className="size-3.5" />}
            </span>
          </label>
        );
      })}
    </div>
  );
}
