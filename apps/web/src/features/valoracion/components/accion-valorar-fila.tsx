import { MessageSquareHeart } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAnnounce } from '@/hooks/use-announce';
import { MENSAJE_GRACIAS } from '../lib/opciones';
import { FormularioValoracion } from './formulario-valoracion';

/**
 * «Valorar» en la fila del historial (HU-515): la misma pregunta de la tarjeta
 * del panel, en un diálogo. Solo se pinta si el servidor dijo `puedeValorar`.
 */
export function AccionValorarFila({ bookingId, titulo }: { bookingId: string; titulo: string }) {
  const [abierto, setAbierto] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const announce = useAnnounce();

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger
        render={<Button variant="outline" className="h-11 gap-2 px-3.5 text-sm" />}
      >
        <MessageSquareHeart aria-hidden="true" strokeWidth={2} className="size-4" />
        Valorar la clase
      </AlertDialogTrigger>

      <AlertDialogContent initialFocus={cerrarRef}>
        <AlertDialogTitle>Tu opinión sobre «{titulo}»</AlertDialogTitle>

        <FormularioValoracion
          bookingId={bookingId}
          titulo={titulo}
          onEnviada={() => {
            setAbierto(false);
            announce(MENSAJE_GRACIAS);
          }}
        />

        <div className="flex justify-end">
          <AlertDialogClose
            render={<Button variant="outline" ref={cerrarRef} className="h-11 px-5 text-base" />}
          >
            Ahora no
          </AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
