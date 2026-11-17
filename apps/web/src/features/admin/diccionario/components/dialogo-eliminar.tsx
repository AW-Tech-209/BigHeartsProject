import type { EliminarConEntradasInput } from '@academia/types';
import { Check, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

type DialogoEliminarProps = {
  tipo: 'unidad' | 'categoria';
  nombre: string;
  entradas: number;
  /** A dónde se pueden mover las entradas (los demás del mismo tipo). */
  destinos: { id: string; nombre: string }[];
  diasPapelera?: number;
  onEliminar: (input: EliminarConEntradasInput) => Promise<void>;
};

const plural = (n: number) => (n === 1 ? '1 entrada' : `${n} entradas`);

/**
 * Eliminar una unidad o categoría. Con entradas: elegir a dónde van y escribir el nombre;
 * sin entradas basta con confirmar. El foco empieza en «Volver».
 */
export function DialogoEliminar({
  tipo,
  nombre,
  entradas,
  destinos,
  diasPapelera = 30,
  onEliminar,
}: DialogoEliminarProps) {
  const id = useId();
  const volver = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [destino, setDestino] = useState<'mover' | 'papelera'>('mover');
  const [haciaId, setHaciaId] = useState('');
  const [escrito, setEscrito] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sustantivo = tipo === 'unidad' ? 'la unidad' : 'la categoría';
  const conEntradas = entradas > 0;
  const coincide = escrito.trim() === nombre;
  const faltaDestino = conEntradas && destino === 'mover' && !haciaId;
  const motivo = !conEntradas
    ? null
    : !coincide
      ? `Escribe «${nombre}» exactamente para poder eliminar.`
      : faltaDestino
        ? `Elige ${tipo === 'unidad' ? 'la unidad' : 'la categoría'} de destino.`
        : null;

  function reiniciar() {
    setDestino('mover');
    setHaciaId('');
    setEscrito('');
    setError(null);
  }

  async function eliminar() {
    if (motivo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await onEliminar(
        conEntradas ? (destino === 'mover' ? { destino, haciaId } : { destino }) : {},
      );
      setAbierto(false);
      reiniciar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos eliminarla. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        if (enviando) return;
        if (!siguiente) reiniciar();
        setAbierto(siguiente);
      }}
    >
      <AlertDialogTrigger render={<Button variant="ghost" className="size-11 text-destructive" />}>
        <Trash2 aria-hidden="true" strokeWidth={2} className="size-5" />
        <span className="sr-only">
          Eliminar {sustantivo} {nombre}
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent initialFocus={volver}>
        <AlertDialogTitle className="font-serif text-2xl">{`Eliminar ${sustantivo} «${nombre}»`}</AlertDialogTitle>
        <AlertDialogDescription>
          {conEntradas
            ? `Tiene ${plural(entradas)}. ¿A dónde van?`
            : 'No tiene entradas. Se puede eliminar sin mover nada.'}
        </AlertDialogDescription>

        {conEntradas && (
          <div className="space-y-4">
            <fieldset className="space-y-3">
              <legend className="sr-only">Qué hacer con sus entradas</legend>
              <label
                className={cn(
                  'block cursor-pointer space-y-3 rounded-xl border p-4',
                  destino === 'mover' ? 'border-2 border-primary bg-primary-soft' : 'border-border',
                )}
              >
                <span className="flex items-center gap-3 text-base font-semibold">
                  <input
                    type="radio"
                    name={`${id}-destino`}
                    checked={destino === 'mover'}
                    onChange={() => setDestino('mover')}
                    className="size-5"
                  />
                  Moverlas a otra {tipo === 'unidad' ? 'unidad' : 'categoría'}
                </span>
                {destino === 'mover' && (
                  <span className="block space-y-1 pl-8">
                    <span id={`${id}-hacia-etiqueta`} className="block text-sm font-medium">
                      {tipo === 'unidad' ? 'Unidad de destino' : 'Categoría de destino'}
                    </span>
                    <NativeSelect
                      aria-labelledby={`${id}-hacia-etiqueta`}
                      value={haciaId}
                      onChange={(e) => setHaciaId(e.target.value)}
                    >
                      <option value="">Elige una</option>
                      {destinos.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                    </NativeSelect>
                  </span>
                )}
              </label>
              <label
                className={cn(
                  'block cursor-pointer rounded-xl border p-4',
                  destino === 'papelera'
                    ? 'border-2 border-primary bg-primary-soft'
                    : 'border-border',
                )}
              >
                <span className="flex items-center gap-3 text-base font-semibold">
                  <input
                    type="radio"
                    name={`${id}-destino`}
                    checked={destino === 'papelera'}
                    onChange={() => setDestino('papelera')}
                    className="size-5"
                  />
                  Enviarlas a la papelera
                </span>
                <span className="block pl-8 text-sm text-muted-foreground">
                  Se pueden restaurar durante {diasPapelera} días.
                </span>
              </label>
            </fieldset>

            <div className="space-y-1">
              <label htmlFor={`${id}-confirmar`} className="block text-base font-medium">
                Para confirmar, escribe <strong>{nombre}</strong>
              </label>
              <Input
                id={`${id}-confirmar`}
                value={escrito}
                autoComplete="off"
                aria-describedby={`${id}-estado`}
                onChange={(e) => setEscrito(e.target.value)}
              />
              <p
                id={`${id}-estado`}
                aria-live="polite"
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                {coincide && <Check aria-hidden="true" strokeWidth={2} className="size-4" />}
                {coincide ? 'Coincide. Ya puedes eliminarla.' : 'Todavía no coincide.'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-base text-destructive">
            {error}
          </p>
        )}
        {motivo && (
          <p id={`${id}-motivo`} className="text-sm text-muted-foreground">
            {motivo}
          </p>
        )}

        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button ref={volver} variant="outline" className="h-11 px-5 text-base" />}
            disabled={enviando}
          >
            Volver
          </AlertDialogClose>
          <Button
            variant="destructive"
            aria-disabled={Boolean(motivo) || undefined}
            aria-describedby={motivo ? `${id}-motivo` : undefined}
            className={cn('h-11 gap-2 px-5 text-base', motivo && 'opacity-60')}
            onClick={() => void eliminar()}
          >
            <Trash2 aria-hidden="true" strokeWidth={2} className="size-4" />
            {enviando
              ? 'Eliminando…'
              : !conEntradas
                ? 'Eliminar'
                : destino === 'mover'
                  ? `Eliminar y mover ${plural(entradas)}`
                  : `Eliminar y enviar ${plural(entradas)} a la papelera`}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
