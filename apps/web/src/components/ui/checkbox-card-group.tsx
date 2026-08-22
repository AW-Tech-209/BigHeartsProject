import { Check, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type CheckboxCardOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon: LucideIcon;
};

type CheckboxCardGroupProps<T extends string> = {
  /** Id del texto que titula el grupo (`aria-labelledby`). */
  labelledBy: string;
  options: CheckboxCardOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  className?: string;
};

/**
 * Selector tipo tarjeta de VARIOS valores a la vez, sobre checkboxes NATIVOS.
 * Mismo patrón visual que `<RadioCardGroup>` — mismo `role`, misma triple
 * codificación (borde/fondo `primary` + ícono `Check` + el propio estado
 * semántico del checkbox) — pero de selección múltiple: un aula puede
 * impartirse en varios modos a la vez (HU-211, decisión 1).
 */
export function CheckboxCardGroup<T extends string>({
  labelledBy,
  options,
  value,
  onChange,
  className,
}: CheckboxCardGroupProps<T>) {
  function alternar(opcion: T) {
    onChange(value.includes(opcion) ? value.filter((v) => v !== opcion) : [...value, opcion]);
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={cn('grid gap-3 sm:grid-cols-2', className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value.includes(option.value);

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
              type="checkbox"
              value={option.value}
              checked={selected}
              onChange={() => alternar(option.value)}
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
                'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
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
