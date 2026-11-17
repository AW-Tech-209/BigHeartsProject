import type { CategoriaAdmin, CrearCategoriaInput, IconoCategoria } from '@academia/types';
import { Pencil, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconoCategoria as Icono } from '@/features/diccionario/components/icono-categoria';
import { cn } from '@/lib/utils';
import {
  eliminarCategoria,
  crearCategoria,
  editarCategoria,
  reordenarCategorias,
} from '../api/estructura';
import { useAccionEstructura } from '../hooks/use-admin-diccionario';
import { moverEnLista } from '../lib/reordenar';
import { BotonesOrden } from './botones-orden';
import { DialogoEliminar } from './dialogo-eliminar';
import { SelectorIcono } from './selector-icono';

const DESCRIPCION_MAX = 140;

export function ListaCategorias({ categorias }: { categorias: CategoriaAdmin[] }) {
  const accion = useAccionEstructura();
  const [editando, setEditando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const ids = categorias.map((c) => c.id);

  return (
    <section
      aria-labelledby="titulo-categorias"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <h2 id="titulo-categorias" className="text-xl font-semibold">
          Categorías
        </h2>
        {editando !== 'nueva' && (
          <Button
            variant="outline"
            className="h-11 gap-2 px-4 text-base"
            onClick={() => setEditando('nueva')}
          >
            <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
            Crear categoría
          </Button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="border-b border-border bg-destructive-soft px-5 py-3 text-base text-destructive"
        >
          {error}
        </p>
      )}
      {editando === 'nueva' && (
        <div className="border-b border-border border-l-4 border-l-primary bg-primary-soft/40 p-5">
          <FormCategoria
            titulo="Nueva categoría"
            guardando={accion.isPending}
            onCancelar={() => setEditando(null)}
            onGuardar={async (input) => {
              if (await correr(() => crearCategoria(input))) setEditando(null);
            }}
          />
        </div>
      )}
      <ul className="divide-y divide-border">
        {categorias.map((c, i) =>
          editando === c.id ? (
            <li key={c.id} className="border-l-4 border-l-primary bg-primary-soft/40 p-5">
              <FormCategoria
                titulo={`Editar «${c.nombre}»`}
                inicial={{
                  nombre: c.nombre,
                  icono: c.icono as IconoCategoria,
                  descripcion: c.descripcion,
                }}
                guardando={accion.isPending}
                onCancelar={() => {
                  setEditando(null);
                  requestAnimationFrame(() =>
                    document.getElementById(`cat-${c.id}-editar`)?.focus(),
                  );
                }}
                onGuardar={async (input) => {
                  if (await correr(() => editarCategoria(c.id, input), `cat-${c.id}-editar`))
                    setEditando(null);
                }}
              />
            </li>
          ) : (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <Icono nombre={c.icono} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-semibold [overflow-wrap:anywhere]">{c.nombre}</span>
                <span className="text-sm text-muted-foreground">
                  {c.palabras} {c.palabras === 1 ? 'entrada' : 'entradas'}
                </span>
              </span>
              <BotonesOrden
                idBase={`cat-${c.id}`}
                nombre={c.nombre}
                esPrimero={i === 0}
                esUltimo={i === categorias.length - 1}
                ocupado={accion.isPending}
                onMover={(paso) => {
                  const nuevos = moverEnLista(ids, c.id, paso);
                  if (nuevos)
                    void correr(
                      () => reordenarCategorias(nuevos),
                      `cat-${c.id}-${paso < 0 ? 'subir' : 'bajar'}`,
                    );
                }}
              />
              <Button
                id={`cat-${c.id}-editar`}
                variant="ghost"
                className="size-11 text-primary"
                onClick={() => setEditando(c.id)}
              >
                <Pencil aria-hidden="true" strokeWidth={2} className="size-5" />
                <span className="sr-only">Editar la categoría {c.nombre}</span>
              </Button>
              <DialogoEliminar
                tipo="categoria"
                nombre={c.nombre}
                entradas={c.palabras}
                destinos={categorias
                  .filter((o) => o.id !== c.id)
                  .map((o) => ({ id: o.id, nombre: o.nombre }))}
                onEliminar={async (input) => {
                  await accion.mutateAsync(() => eliminarCategoria(c.id, input));
                }}
              />
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

function FormCategoria({
  titulo,
  inicial,
  guardando,
  onGuardar,
  onCancelar,
}: {
  titulo: string;
  inicial?: { nombre: string; icono: IconoCategoria; descripcion: string | null };
  guardando: boolean;
  onGuardar: (input: CrearCategoriaInput) => Promise<void>;
  onCancelar: () => void;
}) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [icono, setIcono] = useState<IconoCategoria>(inicial?.icono ?? 'sparkles');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [falta, setFalta] = useState(false);

  useEffect(() => campo.current?.focus(), []);

  return (
    <form
      aria-label={titulo}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return setFalta(true);
        void onGuardar({ nombre: nombre.trim(), icono, descripcion: descripcion.trim() || null });
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancelar()}
    >
      <div className="space-y-1">
        <label htmlFor={`${id}-nombre`} className="block text-base font-medium">
          Nombre
        </label>
        <Input
          ref={campo}
          id={`${id}-nombre`}
          value={nombre}
          aria-invalid={falta || undefined}
          aria-describedby={falta ? `${id}-error` : undefined}
          onChange={(e) => {
            setNombre(e.target.value);
            setFalta(false);
          }}
        />
        {falta && (
          <p id={`${id}-error`} className="text-base text-destructive">
            Escribe el nombre de la categoría.
          </p>
        )}
      </div>
      <SelectorIcono valor={icono} onCambiar={setIcono} />
      <div className="space-y-1">
        <label htmlFor={`${id}-descripcion`} className="block text-base font-medium">
          Descripción corta <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id={`${id}-descripcion`}
          value={descripcion}
          maxLength={DESCRIPCION_MAX}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>
      <div className={cn('flex flex-wrap justify-end gap-3')}>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-4 text-base"
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button type="submit" className="h-11 px-4 text-base">
          {guardando ? 'Guardando…' : 'Guardar categoría'}
        </Button>
      </div>
    </form>
  );
}
