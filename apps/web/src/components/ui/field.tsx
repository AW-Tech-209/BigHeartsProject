import { CircleAlert } from 'lucide-react';
import { cloneElement, type ReactElement, type ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldProps = {
  /** Id del control; se usa para asociar label, descripción y error. */
  id: string;
  label: ReactNode;
  /** El control del formulario (Input, select...). Debe ser un único elemento. */
  children: ReactElement<Record<string, unknown>>;
  error?: string;
  description?: ReactNode;
  required?: boolean;
  className?: string;
  /** Elemento superpuesto al control (p. ej. botón mostrar/ocultar contraseña). */
  adornment?: ReactNode;
};

/**
 * Envoltorio de un campo de formulario que centraliza el patrón accesible
 * (§7.3 de la guía de UI):
 *  - `<label>` visible asociado por `htmlFor`.
 *  - Campos obligatorios marcados con la palabra "(obligatorio)", no solo `*`.
 *  - Error junto al campo con `role="alert"`, ícono `CircleAlert`, texto que
 *    explica, y borde destructivo (vía `aria-invalid` en el control).
 *  - `aria-invalid` + `aria-describedby` cableados automáticamente al control.
 */
export function Field({
  id,
  label,
  children,
  error,
  description,
  required,
  className,
  adornment,
}: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const control = cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
  });

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="font-normal text-muted-foreground"> (obligatorio)</span>}
      </Label>

      {description && (
        <p id={descriptionId} className="max-w-[65ch] text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {adornment ? (
        <div className="relative">
          {control}
          {adornment}
        </div>
      ) : (
        control
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <CircleAlert aria-hidden="true" strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
