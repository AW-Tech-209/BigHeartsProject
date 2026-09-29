import { Check } from 'lucide-react';
import { useId } from 'react';

import { useAnnounce } from '@/hooks/use-announce';
import { TAMANOS_TEXTO, useTamanoTexto, type TamanoTexto } from '@/hooks/use-tamano-texto';
import { cn } from '@/lib/utils';

const OPCIONES: Record<TamanoTexto, { nombre: string; muestra: string }> = {
  normal: { nombre: 'Normal', muestra: 'text-[1rem]' },
  grande: { nombre: 'Grande', muestra: 'text-[1.125rem]' },
  'muy-grande': { nombre: 'Muy grande', muestra: 'text-[1.25rem]' },
};

function Grupo({ compacto, className }: { compacto: boolean; className?: string }) {
  const { tamano, elegir } = useTamanoTexto();
  const announce = useAnnounce();
  const nombre = useId();
  const titulo = useId();

  return (
    <div className={className}>
      <p
        id={titulo}
        className={cn('text-sm font-medium text-foreground', compacto ? 'sr-only' : 'mb-2')}
      >
        Tamaño del texto
      </p>
      <div
        role="radiogroup"
        aria-labelledby={titulo}
        className={cn('flex gap-2', !compacto && 'flex-wrap')}
      >
        {TAMANOS_TEXTO.map((valor) => {
          const opcion = OPCIONES[valor];
          const elegida = valor === tamano;
          return (
            <label
              key={valor}
              className={cn(
                'relative flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transicion-rapida',
                compacto
                  ? 'border-brand-foreground/30 text-brand-foreground'
                  : 'bg-card text-foreground',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                elegida
                  ? compacto
                    ? 'bg-brand-foreground/15'
                    : 'border-primary bg-primary-soft'
                  : compacto
                    ? 'hover:bg-brand-foreground/10'
                    : 'border-border hover:border-input',
              )}
            >
              <input
                type="radio"
                name={nombre}
                value={valor}
                checked={elegida}
                onChange={() => {
                  elegir(valor);
                  announce(`Tamaño de texto ${opcion.nombre.toLowerCase()} activado.`);
                }}
                className="sr-only"
              />
              <span aria-hidden="true" className={cn('font-medium leading-none', opcion.muestra)}>
                Aa
              </span>
              <span className={cn('text-sm font-medium', compacto && 'sr-only sm:not-sr-only')}>
                {opcion.nombre}
              </span>
              {elegida && (
                <Check
                  aria-hidden="true"
                  strokeWidth={3}
                  className={cn('size-4', !compacto && 'text-primary')}
                />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tres tamaños de texto con muestra «Aa» y nombre escrito. `compacto` es la variante de la
 * barra del shell: siempre visible (sin desplegable) y con el nombre solo desde `sm`.
 */
export function SelectorTamanoTexto({
  compacto = false,
  className,
}: {
  compacto?: boolean;
  className?: string;
}) {
  return <Grupo compacto={compacto} className={className} />;
}
