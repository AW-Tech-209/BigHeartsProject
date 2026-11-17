import {
  AccionLote,
  type CategoriaAdmin,
  type LoteEntradasInput,
  type ModuloAdmin,
} from '@academia/types';
import { Eye, EyeOff, FolderInput, LoaderCircle, Move, SquareCheck, Trash2 } from 'lucide-react';
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
import { NativeSelect } from '@/components/ui/native-select';

type BarraLoteProps = {
  cantidad: number;
  modulos: ModuloAdmin[];
  categorias: CategoriaAdmin[];
  pendiente: boolean;
  onAplicar: (accion: Omit<LoteEntradasInput, 'ids'>) => Promise<void>;
  onQuitarSeleccion: () => void;
};

const plural = (n: number) => (n === 1 ? '1 seleccionada' : `${n} seleccionadas`);

export function BarraLote({
  cantidad,
  modulos,
  categorias,
  pendiente,
  onAplicar,
  onQuitarSeleccion,
}: BarraLoteProps) {
  return (
    <section
      aria-label="Acciones con las entradas marcadas"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary-soft p-4"
    >
      <p
        aria-live="polite"
        className="flex items-center gap-2 text-base font-semibold text-primary-soft-foreground"
      >
        <SquareCheck aria-hidden="true" strokeWidth={2} className="size-5" />
        {plural(cantidad)}
      </p>
      <DialogoMover
        modo="categoria"
        modulos={modulos}
        categorias={categorias}
        pendiente={pendiente}
        onAplicar={onAplicar}
      />
      <DialogoMover
        modo="modulo"
        modulos={modulos}
        categorias={categorias}
        pendiente={pendiente}
        onAplicar={onAplicar}
      />
      <Button
        variant="outline"
        disabled={pendiente}
        className="h-11 gap-2 px-4 text-base"
        onClick={() => onAplicar({ accion: AccionLote.OCULTAR }).catch(() => undefined)}
      >
        <EyeOff aria-hidden="true" strokeWidth={2} className="size-4" />
        Ocultar
      </Button>
      <Button
        variant="outline"
        disabled={pendiente}
        className="h-11 gap-2 px-4 text-base"
        onClick={() => onAplicar({ accion: AccionLote.PUBLICAR }).catch(() => undefined)}
      >
        <Eye aria-hidden="true" strokeWidth={2} className="size-4" />
        Publicar
      </Button>
      <Button
        variant="destructive"
        disabled={pendiente}
        className="h-11 gap-2 border border-destructive/40 px-4 text-base"
        onClick={() => onAplicar({ accion: AccionLote.ENVIAR_PAPELERA }).catch(() => undefined)}
      >
        <Trash2 aria-hidden="true" strokeWidth={2} className="size-4" />
        Enviar a la papelera
      </Button>
      <Button
        variant="ghost"
        className="h-11 px-3 text-base text-primary"
        onClick={onQuitarSeleccion}
      >
        Quitar selección
      </Button>
      {pendiente && (
        <p className="flex items-center gap-2 text-base">
          <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-4 animate-spin" />
          Guardando…
        </p>
      )}
    </section>
  );
}

function DialogoMover({
  modo,
  modulos,
  categorias,
  pendiente,
  onAplicar,
}: {
  modo: 'categoria' | 'modulo';
  modulos: ModuloAdmin[];
  categorias: CategoriaAdmin[];
  pendiente: boolean;
  onAplicar: BarraLoteProps['onAplicar'];
}) {
  const id = useId();
  const volver = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [categoriaId, setCategoriaId] = useState('');
  const [moduloId, setModuloId] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const modulo = modulos.find((m) => m.id === moduloId);
  const esCategoria = modo === 'categoria';

  async function mover() {
    if (esCategoria ? !categoriaId : !moduloId) {
      setError(esCategoria ? 'Elige la categoría de destino.' : 'Elige el módulo de destino.');
      return;
    }
    try {
      await onAplicar(
        esCategoria
          ? { accion: AccionLote.MOVER_CATEGORIA, categoriaId }
          : { accion: AccionLote.MOVER_MODULO, moduloId, unidadId: unidadId || null },
      );
      setAbierto(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos moverlas. Inténtalo de nuevo.');
    }
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        if (pendiente && !siguiente) return;
        setError(null);
        setAbierto(siguiente);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button variant="outline" disabled={pendiente} className="h-11 gap-2 px-4 text-base" />
        }
      >
        {esCategoria ? (
          <FolderInput aria-hidden="true" strokeWidth={2} className="size-4" />
        ) : (
          <Move aria-hidden="true" strokeWidth={2} className="size-4" />
        )}
        {esCategoria ? 'Mover de categoría' : 'Mover de módulo o unidad'}
      </AlertDialogTrigger>
      <AlertDialogContent initialFocus={volver}>
        <AlertDialogTitle>
          {esCategoria ? 'Mover a otra categoría' : 'Mover a otro módulo o unidad'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {esCategoria
            ? 'Las entradas marcadas pasan a la categoría que elijas.'
            : 'Sin unidad, las entradas quedan en el módulo sin unidad asignada.'}
        </AlertDialogDescription>

        {esCategoria ? (
          <div className="space-y-2">
            <label htmlFor={`${id}-categoria`} className="block text-base font-medium">
              Categoría de destino
            </label>
            <NativeSelect
              id={`${id}-categoria`}
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Elige una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor={`${id}-modulo`} className="block text-base font-medium">
                Módulo de destino
              </label>
              <NativeSelect
                id={`${id}-modulo`}
                value={moduloId}
                onChange={(e) => {
                  setModuloId(e.target.value);
                  setUnidadId('');
                }}
              >
                <option value="">Elige un módulo</option>
                {modulos.map((m) => (
                  <option key={m.id} value={m.id}>
                    Módulo {m.numero} · {m.nombre}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <label htmlFor={`${id}-unidad`} className="block text-base font-medium">
                Unidad (opcional)
              </label>
              <NativeSelect
                id={`${id}-unidad`}
                value={unidadId}
                onChange={(e) => setUnidadId(e.target.value)}
              >
                <option value="">{modulo ? 'Sin unidad' : 'Elige primero el módulo'}</option>
                {(modulo?.unidades ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    Unidad {u.codigo.slice(1)} · {u.nombre}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-base text-destructive">
            {error}
          </p>
        )}

        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={volver} className="h-11 px-5 text-base" />}
            disabled={pendiente}
          >
            Volver
          </AlertDialogClose>
          <Button
            onClick={() => void mover()}
            disabled={pendiente}
            className="h-11 gap-2 px-5 text-base"
          >
            {pendiente && (
              <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-4 animate-spin" />
            )}
            {pendiente ? 'Moviendo…' : 'Mover'}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
