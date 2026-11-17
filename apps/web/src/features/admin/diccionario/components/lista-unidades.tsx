import type { ModuloAdmin } from '@academia/types';
import { Pencil, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { crearUnidad, editarUnidad, eliminarUnidad, reordenarUnidades } from '../api/estructura';
import { useAccionEstructura } from '../hooks/use-admin-diccionario';
import { moverEnLista, siguienteCodigoUnidad } from '../lib/reordenar';
import { BotonesOrden } from './botones-orden';
import { DialogoEliminar } from './dialogo-eliminar';

const etiqueta = (codigo: string) => `Unidad ${codigo.replace(/^U/, '')}`;

export function ListaUnidades({ modulo }: { modulo: ModuloAdmin }) {
  const accion = useAccionEstructura();
  const [editando, setEditando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unidades = modulo.unidades;
  const ids = unidades.map((u) => u.id);

  async function correr(tarea: () => Promise<unknown>, foco?: string) {
    setError(null);
    try {
      await accion.mutateAsync(tarea);
      if (foco) requestAnimationFrame(() => document.getElementById(foco)?.focus());
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos guardar el cambio. Inténtalo de nuevo.',
      );
      return false;
    }
  }

  return (
    <div className="bg-muted/40">
      {error && (
        <p role="alert" className="px-5 py-3 text-base text-destructive">
          {error}
        </p>
      )}
      <ul className="divide-y divide-border">
        {unidades.map((u, i) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 py-3 pr-5 pl-10">
            {editando === u.id ? (
              <FormNombre
                etiqueta={`Nombre de la ${etiqueta(u.codigo)}`}
                inicial={u.nombre}
                guardando={accion.isPending}
                onCancelar={() => {
                  setEditando(null);
                  requestAnimationFrame(() =>
                    document.getElementById(`uni-${u.id}-editar`)?.focus(),
                  );
                }}
                onGuardar={async (nombre) => {
                  if (await correr(() => editarUnidad(u.id, nombre), `uni-${u.id}-editar`))
                    setEditando(null);
                }}
              />
            ) : (
              <>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-medium [overflow-wrap:anywhere]">
                    {etiqueta(u.codigo)} · <span lang="en">{u.nombre}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {u.palabras} {u.palabras === 1 ? 'entrada' : 'entradas'}
                  </span>
                </span>
                <BotonesOrden
                  idBase={`uni-${u.id}`}
                  nombre={etiqueta(u.codigo)}
                  esPrimero={i === 0}
                  esUltimo={i === unidades.length - 1}
                  ocupado={accion.isPending}
                  onMover={(paso) => {
                    const nuevos = moverEnLista(ids, u.id, paso);
                    if (nuevos)
                      void correr(
                        () => reordenarUnidades(modulo.id, nuevos),
                        `uni-${u.id}-${paso < 0 ? 'subir' : 'bajar'}`,
                      );
                  }}
                />
                <Button
                  id={`uni-${u.id}-editar`}
                  variant="ghost"
                  className="size-11 text-primary"
                  onClick={() => setEditando(u.id)}
                >
                  <Pencil aria-hidden="true" strokeWidth={2} className="size-5" />
                  <span className="sr-only">Renombrar la {etiqueta(u.codigo)}</span>
                </Button>
                <DialogoEliminar
                  tipo="unidad"
                  nombre={`${etiqueta(u.codigo)} · ${u.nombre}`}
                  entradas={u.palabras}
                  destinos={unidades
                    .filter((o) => o.id !== u.id)
                    .map((o) => ({ id: o.id, nombre: `${etiqueta(o.codigo)} · ${o.nombre}` }))}
                  onEliminar={async (input) => {
                    await accion.mutateAsync(() => eliminarUnidad(u.id, input));
                  }}
                />
              </>
            )}
          </li>
        ))}
        <li className="py-3 pr-5 pl-10">
          {editando === 'nueva' ? (
            <FormNombre
              etiqueta={`Nombre de la ${etiqueta(siguienteCodigoUnidad(unidades.map((u) => u.codigo)))}`}
              inicial=""
              guardando={accion.isPending}
              onCancelar={() => setEditando(null)}
              onGuardar={async (nombre) => {
                if (await correr(() => crearUnidad(modulo.id, nombre))) setEditando(null);
              }}
            />
          ) : (
            <Button
              variant="ghost"
              className="h-11 gap-2 px-3 text-base text-primary"
              onClick={() => setEditando('nueva')}
            >
              <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
              Agregar unidad al Módulo {modulo.numero}
            </Button>
          )}
        </li>
      </ul>
    </div>
  );
}

function FormNombre({
  etiqueta: texto,
  inicial,
  guardando,
  onGuardar,
  onCancelar,
}: {
  etiqueta: string;
  inicial: string;
  guardando: boolean;
  onGuardar: (nombre: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(inicial);
  const [falta, setFalta] = useState(false);
  useEffect(() => campo.current?.focus(), []);

  return (
    <form
      className="flex w-full flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return setFalta(true);
        void onGuardar(nombre.trim());
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancelar()}
    >
      <div className="min-w-48 flex-1 space-y-1">
        <label htmlFor={`${id}-nombre`} className="block text-sm font-medium">
          {texto}
        </label>
        <Input
          ref={campo}
          id={`${id}-nombre`}
          lang="en"
          value={nombre}
          aria-invalid={falta || undefined}
          aria-describedby={falta ? `${id}-error` : undefined}
          onChange={(e) => {
            setNombre(e.target.value);
            setFalta(false);
          }}
        />
        {falta && (
          <p id={`${id}-error`} className="text-sm text-destructive">
            Escribe el nombre de la unidad.
          </p>
        )}
      </div>
      <Button type="button" variant="outline" className="h-11 px-4 text-base" onClick={onCancelar}>
        Cancelar
      </Button>
      <Button type="submit" className="h-11 px-4 text-base">
        {guardando ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  );
}
