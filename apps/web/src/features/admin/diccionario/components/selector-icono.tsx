import { ICONOS_CATEGORIA, type IconoCategoria } from '@academia/types';
import { type KeyboardEvent, useId, useRef } from 'react';

import { IconoCategoria as Icono } from '@/features/diccionario/components/icono-categoria';
import { NOMBRE_ICONO } from '@/features/diccionario/lib/iconos-categoria';
import { cn } from '@/lib/utils';

/** Rejilla de la lista curada como radiogroup: Tab entra en el elegido y las flechas recorren. */
export function SelectorIcono({
  valor,
  onCambiar,
}: {
  valor: IconoCategoria;
  onCambiar: (icono: IconoCategoria) => void;
}) {
  const id = useId();
  const grupo = useRef<HTMLDivElement>(null);

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
    if (!paso) return;
    evento.preventDefault();
    const i = ICONOS_CATEGORIA.indexOf(valor);
    const siguiente =
      ICONOS_CATEGORIA[(i + paso + ICONOS_CATEGORIA.length) % ICONOS_CATEGORIA.length];
    if (!siguiente) return;
    onCambiar(siguiente);
    grupo.current?.querySelector<HTMLElement>(`[data-icono="${siguiente}"]`)?.focus();
  }

  return (
    <div className="space-y-2">
      <p id={`${id}-titulo`} className="text-base font-medium">
        Ícono
      </p>
      <div
        ref={grupo}
        role="radiogroup"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-ayuda`}
        onKeyDown={alTeclear}
        className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2"
      >
        {ICONOS_CATEGORIA.map((icono) => {
          const activo = icono === valor;
          return (
            <button
              key={icono}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={NOMBRE_ICONO[icono]}
              title={NOMBRE_ICONO[icono]}
              tabIndex={activo ? 0 : -1}
              data-icono={icono}
              onClick={() => onCambiar(icono)}
              className={cn(
                'flex size-11 items-center justify-center rounded-lg border transicion-rapida',
                activo
                  ? 'border-2 border-primary bg-primary-soft'
                  : 'border-border bg-background hover:bg-muted',
              )}
            >
              <Icono nombre={icono} className="size-5" />
            </button>
          );
        })}
      </div>
      <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">
        Lista corta de íconos revisados para que se entiendan sin texto.
      </p>
    </div>
  );
}
