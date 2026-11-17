import { X } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

const DURACION_AVISO_MS = 8000;

export type Aviso = {
  id: number;
  mensaje: string;
  accion?: { texto: string; onClick: () => void };
};

/**
 * Aviso flotante de al menos 8 s, con cerrar. La región `role="status"` existe siempre
 * para que el lector anuncie el mensaje en cuanto aparece.
 */
export function AvisoDeshacer({ aviso, onCerrar }: { aviso: Aviso | null; onCerrar: () => void }) {
  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(onCerrar, DURACION_AVISO_MS);
    return () => clearTimeout(id);
  }, [aviso, onCerrar]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center lg:bottom-6"
    >
      {aviso && (
        <div className="subir-suave pointer-events-auto flex max-w-xl flex-wrap items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
          <p className="text-base font-medium">{aviso.mensaje}</p>
          {aviso.accion && (
            <Button
              variant="outline"
              className="h-11 px-4 text-base"
              onClick={() => {
                aviso.accion?.onClick();
                onCerrar();
              }}
            >
              {aviso.accion.texto}
            </Button>
          )}
          <Button
            variant="ghost"
            aria-label="Cerrar el aviso"
            className="size-11"
            onClick={onCerrar}
          >
            <X aria-hidden="true" strokeWidth={2} className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
