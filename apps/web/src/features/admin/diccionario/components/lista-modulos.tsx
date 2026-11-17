import { EstadoModulo, type ModuloAdmin, TRAMO_MODULO_LABELS, TramoModulo } from '@academia/types';
import { ChevronDown, ChevronRight, CircleCheck, Clock, Pencil } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { InsigniaTramo } from '@/features/diccionario/components/insignia-tramo';
import { editarModulo } from '../api/estructura';
import { useAccionEstructura } from '../hooks/use-admin-diccionario';
import { ListaUnidades } from './lista-unidades';

export function ListaModulos({ modulos }: { modulos: ModuloAdmin[] }) {
  const disponibles = modulos.filter((m) => m.estado === EstadoModulo.DISPONIBLE).length;

  return (
    <section
      aria-labelledby="titulo-modulos"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <h2 id="titulo-modulos" className="text-xl font-semibold">
          Módulos y unidades
        </h2>
        <p className="text-base text-muted-foreground">
          {modulos.length} módulos · {disponibles} disponibles
        </p>
      </div>
      <ul className="divide-y divide-border">
        {modulos.map((m, i) => (
          <FilaModulo key={m.id} modulo={m} abiertoAlInicio={i === 0} />
        ))}
      </ul>
    </section>
  );
}

function FilaModulo({
  modulo,
  abiertoAlInicio,
}: {
  modulo: ModuloAdmin;
  abiertoAlInicio: boolean;
}) {
  const id = useId();
  const accion = useAccionEstructura();
  const volver = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(modulo.nombre);
  const [tramo, setTramo] = useState(modulo.tramo);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disponible = modulo.estado === EstadoModulo.DISPONIBLE;
  const titulo = `Módulo ${modulo.numero}`;

  async function guardar(input: Parameters<typeof editarModulo>[1]) {
    setError(null);
    try {
      await accion.mutateAsync(() => editarModulo(modulo.id, input));
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos guardar el cambio. Inténtalo de nuevo.',
      );
      return false;
    }
  }

  return (
    <li>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <Button
          variant="ghost"
          aria-expanded={abierto}
          aria-controls={`${id}-unidades`}
          className="size-11"
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? (
            <ChevronDown aria-hidden="true" className="size-5" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-5" />
          )}
          <span className="sr-only">
            {abierto ? 'Ocultar' : 'Ver'} las unidades del {titulo}
          </span>
        </Button>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg font-semibold">{titulo}</span>
          <span className="text-sm text-muted-foreground">
            <span lang="en">{modulo.nombre}</span> · {modulo.unidades.length} unidades ·{' '}
            {modulo.palabras ? `${modulo.palabras} entradas` : 'sin entradas'}
          </span>
        </span>
        <InsigniaTramo tramo={modulo.tramo} />
        <Badge
          tono={disponible ? 'success' : 'neutral'}
          icon={disponible ? CircleCheck : Clock}
          className="px-2 py-0.5 text-sm"
        >
          {disponible ? 'Disponible' : 'Próximamente'}
        </Badge>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-base">
          <Switch checked={disponible} onCheckedChange={() => setConfirmar(true)} />
          <span className="sr-only">{titulo} </span>
          Disponible
        </label>
        <Button
          variant="outline"
          className="h-11 gap-2 px-4 text-base"
          onClick={() => setEditando((e) => !e)}
          aria-expanded={editando}
        >
          <Pencil aria-hidden="true" strokeWidth={2} className="size-4" />
          Editar<span className="sr-only"> el {titulo}</span>
        </Button>
      </div>

      {error && (
        <p role="alert" className="px-5 pb-3 text-base text-destructive">
          {error}
        </p>
      )}

      {editando && (
        <form
          className="grid gap-3 border-t border-border border-l-4 border-l-primary bg-primary-soft/40 px-5 py-4 sm:grid-cols-[1fr_12rem_auto]"
          onSubmit={async (e) => {
            e.preventDefault();
            if (nombre.trim() && (await guardar({ nombre: nombre.trim(), tramo })))
              setEditando(false);
          }}
          onKeyDown={(e) => e.key === 'Escape' && setEditando(false)}
        >
          <div className="space-y-1">
            <label htmlFor={`${id}-nombre`} className="block text-sm font-medium">
              Nombre del {titulo}
            </label>
            <Input
              id={`${id}-nombre`}
              lang="en"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-tramo`} className="block text-sm font-medium">
              Tramo
            </label>
            <NativeSelect
              id={`${id}-tramo`}
              value={tramo}
              onChange={(e) => setTramo(e.target.value as TramoModulo)}
            >
              {Object.values(TramoModulo).map((t) => (
                <option key={t} value={t}>
                  {TRAMO_MODULO_LABELS[t]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 text-base"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-11 px-4 text-base">
              {accion.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}

      <div id={`${id}-unidades`} hidden={!abierto} className="border-t border-border">
        {abierto && <ListaUnidades modulo={modulo} />}
      </div>

      <AlertDialog open={confirmar} onOpenChange={(s) => !accion.isPending && setConfirmar(s)}>
        <AlertDialogContent initialFocus={volver}>
          <AlertDialogTitle>
            {disponible ? `¿Volver a «Próximamente» el ${titulo}?` : `¿Publicar el ${titulo}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {disponible
              ? 'Los estudiantes dejarán de ver sus palabras hasta que lo publiques otra vez.'
              : `Los estudiantes verán sus ${modulo.palabras} palabras.`}
          </AlertDialogDescription>
          <AlertDialogAcciones>
            <AlertDialogClose
              render={<Button ref={volver} variant="outline" className="h-11 px-5 text-base" />}
            >
              Volver
            </AlertDialogClose>
            <Button
              className="h-11 px-5 text-base"
              onClick={async () => {
                const estado = disponible ? EstadoModulo.PROXIMAMENTE : EstadoModulo.DISPONIBLE;
                if (await guardar({ estado })) setConfirmar(false);
              }}
            >
              {accion.isPending ? 'Guardando…' : disponible ? 'Pasar a Próximamente' : 'Publicar'}
            </Button>
          </AlertDialogAcciones>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
