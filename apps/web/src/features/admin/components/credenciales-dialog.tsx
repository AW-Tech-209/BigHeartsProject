import type { CuentaCreadaResponse } from '@academia/types';
import { Check, Copy, KeyRound, MessageCircle, TriangleAlert, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAnnounce } from '@/hooks/use-announce';
import { cn } from '@/lib/utils';
import { construirBloqueCredenciales, urlWhatsApp } from '../lib/credenciales';

type Copiado = 'todo' | 'clave';

type Props = {
  cuenta: CuentaCreadaResponse;
  onClose: () => void;
  /** Cierra el diálogo y deja el formulario vacío. */
  onCrearOtra: () => void;
};

/**
 * Se monta solo mientras hay una cuenta que mostrar: la contraseña vive en la
 * prop y en el estado de este componente, y al desmontarlo desaparece.
 *
 * El «¿Cerrar sin copiar?» va dentro del mismo diálogo, nunca en un segundo modal.
 */
export function CredencialesDialog({ cuenta, onClose, onCrearOtra }: Props) {
  const announce = useAnnounce();
  const bloqueRef = useRef<HTMLPreElement>(null);
  const copiarRef = useRef<HTMLButtonElement>(null);
  const [copiado, setCopiado] = useState<Copiado | null>(null);
  const [yaSalio, setYaSalio] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const bloque = construirBloqueCredenciales({
    nombre: cuenta.usuario.firstName,
    correo: cuenta.usuario.email,
    contrasena: cuenta.contrasenaTemporal,
    caducaEl: cuenta.caducaEl,
    origen: window.location.origin,
  });

  async function copiar(que: Copiado) {
    try {
      await navigator.clipboard.writeText(que === 'todo' ? bloque : cuenta.contrasenaTemporal);
    } catch {
      setFallo(true);
      announce('No pudimos copiar. El texto quedó seleccionado: cópialo a mano.');
      const seleccion = window.getSelection();
      if (bloqueRef.current && seleccion) seleccion.selectAllChildren(bloqueRef.current);
      return;
    }
    setFallo(false);
    setYaSalio(true);
    setCopiado(que);
    announce(que === 'todo' ? 'Credenciales copiadas.' : 'Contraseña copiada.');
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(null), 3000);
  }

  function intentarCerrar() {
    if (yaSalio) onClose();
    else setConfirmandoCierre(true);
  }

  const etiqueta = (que: Copiado, normal: string) =>
    copiado === que ? (
      <>
        <Check aria-hidden="true" strokeWidth={2} className="size-5" />
        Copiado
      </>
    ) : (
      <>
        <Copy aria-hidden="true" strokeWidth={2} className="size-5" />
        {normal}
      </>
    );

  return (
    <AlertDialog
      open
      onOpenChange={(abierto) => {
        if (!abierto) intentarCerrar();
      }}
    >
      <AlertDialogContent
        initialFocus={copiarRef}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <AlertDialogTitle>
          {`Cuenta de ${cuenta.usuario.firstName} ${cuenta.usuario.lastName}`}
        </AlertDialogTitle>
        <AlertDialogDescription>
          Copia el mensaje y pégalo en WhatsApp para enviárselo.
        </AlertDialogDescription>

        <Callout
          variant="attention"
          icon={TriangleAlert}
          title="Esta contraseña no se volverá a mostrar"
        >
          <p>Cópiala ahora. Si la pierdes, puedes generar otra desde la lista.</p>
        </Callout>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <KeyRound aria-hidden="true" strokeWidth={2} className="size-4" />
            Contraseña temporal
          </p>
          <p className="rounded-lg border border-border bg-muted px-4 py-3 font-mono text-3xl font-semibold tracking-wide break-all text-foreground">
            {cuenta.contrasenaTemporal}
          </p>
        </div>

        <pre
          ref={bloqueRef}
          className="rounded-lg border border-border bg-card p-4 text-base whitespace-pre-wrap break-words"
        >
          {bloque}
        </pre>

        {fallo && (
          <Callout variant="destructive" live="assertive" title="No pudimos copiar por ti">
            <p>El mensaje quedó seleccionado. Cópialo con Ctrl+C (o «Copiar» en el móvil).</p>
          </Callout>
        )}

        {confirmandoCierre ? (
          <div className="space-y-4">
            <Callout variant="destructive" live="assertive" title="¿Cerrar sin copiar?">
              <p>La contraseña no se volverá a mostrar.</p>
            </Callout>
            <AlertDialogAcciones>
              <Button
                variant="outline"
                autoFocus
                onClick={() => setConfirmandoCierre(false)}
                className="h-12 px-5 text-base"
              >
                Volver y copiar
              </Button>
              <Button variant="destructive" onClick={onClose} className="h-12 px-5 text-base">
                Cerrar sin copiar
              </Button>
            </AlertDialogAcciones>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <Button
                ref={copiarRef}
                onClick={() => void copiar('todo')}
                className="h-12 gap-2 px-5 text-base"
              >
                {etiqueta('todo', 'Copiar credenciales')}
              </Button>
              <Button
                variant="outline"
                onClick={() => void copiar('clave')}
                className="h-12 gap-2 px-5 text-base"
              >
                {etiqueta('clave', 'Copiar solo la contraseña')}
              </Button>
              <a
                href={urlWhatsApp(bloque)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setYaSalio(true)}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-12 gap-2 px-5 text-base')}
              >
                <MessageCircle aria-hidden="true" strokeWidth={2} className="size-5" />
                Enviar por WhatsApp
              </a>
            </div>
            <AlertDialogAcciones>
              <Button variant="outline" onClick={intentarCerrar} className="h-12 px-5 text-base">
                Cerrar
              </Button>
              <Button
                variant="secondary"
                onClick={() => (yaSalio ? onCrearOtra() : setConfirmandoCierre(true))}
                className="h-12 gap-2 px-5 text-base"
              >
                <UserPlus aria-hidden="true" strokeWidth={2} className="size-5" />
                Crear otra cuenta
              </Button>
            </AlertDialogAcciones>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
