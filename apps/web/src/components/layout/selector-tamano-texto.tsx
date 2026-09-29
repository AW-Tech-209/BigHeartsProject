import { Check, ALargeSmall } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAnnounce } from '@/hooks/use-announce';
import { TAMANOS_TEXTO, useTamanoTexto, type TamanoTexto } from '@/hooks/use-tamano-texto';
import { cn } from '@/lib/utils';

const OPCIONES: Record<TamanoTexto, { nombre: string; muestra: string }> = {
  normal: { nombre: 'Normal', muestra: 'text-[1rem]' },
  grande: { nombre: 'Grande', muestra: 'text-[1.125rem]' },
  'muy-grande': { nombre: 'Muy grande', muestra: 'text-[1.25rem]' },
};

function Grupo({ className }: { className?: string }) {
  const { tamano, elegir } = useTamanoTexto();
  const announce = useAnnounce();
  const nombre = useId();
  const titulo = useId();

  return (
    <div className={className}>
      <p id={titulo} className="mb-2 text-sm font-medium text-foreground">
        Tamaño del texto
      </p>
      <div role="radiogroup" aria-labelledby={titulo} className="flex flex-wrap gap-2">
        {TAMANOS_TEXTO.map((valor) => {
          const opcion = OPCIONES[valor];
          const elegida = valor === tamano;
          return (
            <label
              key={valor}
              className={cn(
                'relative flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-2 text-foreground transicion-rapida',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                elegida ? 'border-primary bg-primary-soft' : 'border-border hover:border-input',
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
              <span className="text-sm font-medium">{opcion.nombre}</span>
              {elegida && (
                <Check aria-hidden="true" strokeWidth={3} className="size-4 text-primary" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tres tamaños de texto con muestra «Aa» y nombre escrito. `compacto` lo pliega tras un
 * botón para la barra del shell; sin él es el grupo abierto (perfil, acceso).
 */
export function SelectorTamanoTexto({
  compacto = false,
  className,
}: {
  compacto?: boolean;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const panel = useId();

  if (!compacto) return <Grupo className={className} />;

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={panel}
        aria-label="Tamaño del texto"
        className={cn('size-11 shrink-0 rounded-full', className)}
      >
        <ALargeSmall aria-hidden="true" strokeWidth={2} className="size-5" />
      </Button>
      <div
        id={panel}
        hidden={!abierto}
        onKeyDown={(e) => e.key === 'Escape' && setAbierto(false)}
        className="absolute right-0 top-full z-50 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      >
        <Grupo />
      </div>
    </div>
  );
}
