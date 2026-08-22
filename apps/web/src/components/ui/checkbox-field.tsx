import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Ícono de lucide: la mitad no cromática de la codificación triple. */
  icon: LucideIcon;
  className?: string;
};

/**
 * Un checkbox con su `<label>` visible, para un dato booleano independiente
 * (los tres apoyos de un aula: intérprete, subtítulos en vivo, materiales
 * visuales). No es una tarjeta de selección como `<CheckboxCardGroup>` —cada
 * apoyo se marca solo, no compite con los demás por espacio ni por atención.
 *
 * Objetivo táctil ≥44px (`min-h-11`) y foco visible sobre la fila completa,
 * no solo sobre el cuadrito de 16px.
 */
export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  icon: Icon,
  className,
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-colors',
        'hover:border-input',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 rounded border-input text-primary focus-visible:outline-none"
      />
      <Icon
        aria-hidden="true"
        strokeWidth={2}
        className={cn('size-5 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')}
      />
      <span className="text-base text-foreground">{label}</span>
    </label>
  );
}
