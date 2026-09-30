import type { AdminUsuarioItem } from '@academia/types';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type Props = {
  usuario: AdminUsuarioItem;
  isPending: boolean;
  /** Se resuelve cuando el servidor contestó, haya ido bien o mal. */
  onConfirm: (usuario: AdminUsuarioItem) => Promise<void>;
};

export function RegenerarContrasenaDialog({ usuario, isPending, onConfirm }: Props) {
  const volverRef = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const nombre = `${usuario.firstName} ${usuario.lastName}`;

  async function confirmar() {
    await onConfirm(usuario);
    setAbierto(false);
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        if (isPending && !siguiente) return;
        setAbierto(siguiente);
      }}
    >
      <AlertDialogTrigger
        render={<Button variant="outline" className="h-11 gap-2 px-4 text-base" />}
      >
        <KeyRound aria-hidden="true" strokeWidth={2} className="size-5" />
        <span aria-hidden="true">Generar contraseña nueva</span>
        <span className="sr-only">Generar contraseña nueva para {nombre}</span>
      </AlertDialogTrigger>

      <AlertDialogContent initialFocus={volverRef}>
        <AlertDialogTitle>{`¿Generar una contraseña nueva para ${nombre}?`}</AlertDialogTitle>
        <AlertDialogDescription>
          Se cerrarán sus sesiones abiertas y la contraseña anterior dejará de servir.
        </AlertDialogDescription>
        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={volverRef} className="h-11 px-5 text-base" />}
            disabled={isPending}
          >
            Volver
          </AlertDialogClose>
          <Button
            onClick={() => void confirmar()}
            disabled={isPending}
            className="h-11 gap-2 px-5 text-base"
          >
            {isPending ? (
              <>
                <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <KeyRound aria-hidden="true" strokeWidth={2} className="size-5" />
                Generar contraseña
              </>
            )}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
