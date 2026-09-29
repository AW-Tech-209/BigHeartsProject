import { Dialog } from '@base-ui/react/dialog';
import { LifeBuoy, Mail, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  enlaceDeWhatsApp,
  HORARIO_DE_SOPORTE,
  mensajeDeAyuda,
  nombreDePantalla,
  SOPORTE,
  type Soporte,
} from '@/lib/soporte';
import { useContextoAyudaStore } from '@/stores/contexto-ayuda-store';

type BotonAyudaProps = {
  className?: string;
  /** Solo para tests: por defecto, lo que dicen las variables de entorno. */
  soporte?: Soporte;
};

const ENLACE_EXTERNO =
  'flex min-h-12 items-center gap-3 rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground transicion-rapida hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none';

/**
 * Ayuda escrita, nunca una llamada: abre WhatsApp y/o correo según lo que esté
 * configurado. Sin ningún canal no se renderiza.
 */
export function BotonAyuda({ className, soporte = SOPORTE }: BotonAyudaProps) {
  const { pathname } = useLocation();
  const clase = useContextoAyudaStore((s) => s.clase);

  if (!soporte.whatsapp && !soporte.correo) return null;

  const mensaje = mensajeDeAyuda(nombreDePantalla(pathname), clase);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className={cn(buttonVariants({ variant: 'outline' }), 'h-11 gap-2 px-3 text-sm', className)}
      >
        <LifeBuoy aria-hidden="true" strokeWidth={2} className="size-4" />
        ¿Necesitas ayuda?
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-(--duracion-rapida) data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-lg origin-center transition-[opacity,scale] duration-(--duracion-rapida) ease-suave data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <Dialog.Title className="font-serif text-xl font-medium text-balance text-foreground">
            ¿Necesitas ayuda?
          </Dialog.Title>
          <Dialog.Description className="max-w-[65ch] text-base text-muted-foreground">
            Escríbenos. {HORARIO_DE_SOPORTE}
          </Dialog.Description>

          <ul className="space-y-3">
            {soporte.whatsapp && (
              <li>
                <a
                  href={enlaceDeWhatsApp(soporte.whatsapp, mensaje)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ENLACE_EXTERNO}
                >
                  <MessageCircle aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
                  Escríbenos por WhatsApp
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              </li>
            )}
            {soporte.correo && (
              <li>
                <a
                  href={`mailto:${soporte.correo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ENLACE_EXTERNO}
                >
                  <Mail aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
                  Escríbenos un correo
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              </li>
            )}
          </ul>

          <div className="flex justify-end pt-2">
            <Dialog.Close
              className={cn(buttonVariants({ variant: 'outline' }), 'h-12 px-4 text-base')}
            >
              Cerrar
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
