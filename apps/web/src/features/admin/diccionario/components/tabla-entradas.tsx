import type { EntradaAdmin } from '@academia/types';
import { Eye, EyeOff, FilePenLine, Image, Pencil, X } from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Ingles } from '@/components/dominio/ingles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChipTipo } from '@/features/diccionario/components/chip-tipo';
import { EstadoSena } from '@/features/diccionario/components/estado-sena';
import { IconoCategoria } from '@/features/diccionario/components/icono-categoria';
import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';
import { EdicionRapida } from './edicion-rapida';

type TablaEntradasProps = {
  entradas: EntradaAdmin[];
  seleccion: ReadonlySet<string>;
  onMarcar: (id: string, marcada: boolean) => void;
  onMarcarPagina: (marcadas: boolean) => void;
  onGuardada: (entrada: EntradaAdmin) => void;
  onAbrirEditor: (id: string) => (evento: MouseEvent) => void;
};

export function TablaEntradas({
  entradas,
  seleccion,
  onMarcar,
  onMarcarPagina,
  onGuardada,
  onAbrirEditor,
}: TablaEntradasProps) {
  const esMovil = useEsMovil();
  const [editando, setEditando] = useState<string | null>(null);
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const enfocar = useRef<string | null>(null);

  // Al cerrar la edición, el foco vuelve al «Editar» de esa fila.
  useEffect(() => {
    if (editando === null && enfocar.current) {
      botones.current.get(enfocar.current)?.focus();
      enfocar.current = null;
    }
  });

  const cerrar = (id: string) => {
    enfocar.current = id;
    setEditando(null);
  };

  const props = (entrada: EntradaAdmin): FilaProps => ({
    entrada,
    marcada: seleccion.has(entrada.id),
    editando: editando === entrada.id,
    onMarcar: (marcada: boolean) => onMarcar(entrada.id, marcada),
    onEditar: () => setEditando(entrada.id),
    onCancelar: () => cerrar(entrada.id),
    onGuardado: (guardada: EntradaAdmin) => {
      cerrar(entrada.id);
      onGuardada(guardada);
    },
    onAbrirEditor: onAbrirEditor(entrada.id),
    refEditar: (boton: HTMLButtonElement | null) => {
      if (boton) botones.current.set(entrada.id, boton);
      else botones.current.delete(entrada.id);
    },
  });

  const todas = entradas.length > 0 && entradas.every((e) => seleccion.has(e.id));

  if (esMovil) {
    return (
      <div className="space-y-3">
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input
            type="checkbox"
            className="size-5"
            checked={todas}
            onChange={(e) => onMarcarPagina(e.target.checked)}
          />
          Marcar todas las de esta página
        </label>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {entradas.map((entrada) => (
            <TarjetaEntrada key={entrada.id} {...props(entrada)} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              aria-label="Marcar todas las de esta página"
              className="size-5"
              checked={todas}
              onChange={(e) => onMarcarPagina(e.target.checked)}
            />
          </TableHead>
          <TableHead>Inglés</TableHead>
          <TableHead>Español</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Módulo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Seña</TableHead>
          <TableHead>Imagen</TableHead>
          <TableHead>Visible</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entradas.map((entrada) => (
          <FilaEntrada key={entrada.id} {...props(entrada)} />
        ))}
      </TableBody>
    </Table>
  );
}

type FilaProps = {
  entrada: EntradaAdmin;
  marcada: boolean;
  editando: boolean;
  onMarcar: (marcada: boolean) => void;
  onEditar: () => void;
  onCancelar: () => void;
  onGuardado: (guardada: EntradaAdmin) => void;
  refEditar: (boton: HTMLButtonElement | null) => void;
  onAbrirEditor: (evento: MouseEvent) => void;
};

function Marcar({
  entrada,
  marcada,
  onMarcar,
}: Pick<FilaProps, 'entrada' | 'marcada' | 'onMarcar'>) {
  return (
    <input
      type="checkbox"
      aria-label={`Marcar ${entrada.ingles}`}
      className="size-5"
      checked={marcada}
      onChange={(e) => onMarcar(e.target.checked)}
    />
  );
}

function Acciones({
  entrada,
  onEditar,
  refEditar,
  onAbrirEditor,
}: Pick<FilaProps, 'entrada' | 'onEditar' | 'refEditar' | 'onAbrirEditor'>) {
  return (
    <div className="flex items-center gap-1">
      <Button ref={refEditar} variant="ghost" className="size-11 text-primary" onClick={onEditar}>
        <Pencil aria-hidden="true" strokeWidth={2} className="size-5" />
        <span className="sr-only">Editar {entrada.ingles}</span>
      </Button>
      <Link
        to={`/admin/diccionario/entrada/${entrada.id}`}
        onClick={onAbrirEditor}
        className="flex size-11 items-center justify-center rounded-lg text-primary hover:bg-muted"
      >
        <FilePenLine aria-hidden="true" strokeWidth={2} className="size-5" />
        <span className="sr-only">Abrir {entrada.ingles} en el editor</span>
      </Link>
    </div>
  );
}

function Visible({ publicada }: { publicada: boolean }) {
  return publicada ? (
    <Badge tono="success" icon={Eye} className="px-2 py-0.5 text-sm">
      Publicada
    </Badge>
  ) : (
    <Badge tono="neutral" icon={EyeOff} className="px-2 py-0.5 text-sm">
      Oculta
    </Badge>
  );
}

function TieneImagen({ si }: { si: boolean }) {
  const Icono = si ? Image : X;
  return (
    <span className="inline-flex items-center gap-1.5 text-base">
      <Icono aria-hidden="true" strokeWidth={2} className="size-4 text-muted-foreground" />
      {si ? 'Sí' : 'No'}
    </span>
  );
}

const ubicacion = (e: EntradaAdmin) =>
  `M${e.modulo.numero}${e.unidad ? ` · ${e.unidad.codigo}` : ''}`;

function FilaEntrada(props: FilaProps) {
  const { entrada, marcada, editando } = props;

  if (editando) {
    return (
      <TableRow className="border-l-4 border-l-primary bg-primary-soft/40">
        <TableCell className="align-top">
          <Marcar {...props} />
        </TableCell>
        <TableCell colSpan={9}>
          <EdicionRapida
            entrada={entrada}
            onCancelar={props.onCancelar}
            onGuardado={props.onGuardado}
          />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={cn(marcada && 'bg-primary-soft/40')}>
      <TableCell>
        <Marcar {...props} />
      </TableCell>
      <TableCell>
        <Ingles className="font-medium">{entrada.ingles}</Ingles>
      </TableCell>
      <TableCell>{entrada.espanol}</TableCell>
      <TableCell>
        <ChipTipo tipo={entrada.tipo} />
      </TableCell>
      <TableCell className="whitespace-nowrap">{ubicacion(entrada)}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1.5">
          <IconoCategoria nombre={entrada.categoria.icono} className="size-4" />
          {entrada.categoria.nombre}
        </span>
      </TableCell>
      <TableCell>
        <EstadoSena vista="admin" estado={entrada.sena.estado} className="px-2 py-0.5 text-sm" />
      </TableCell>
      <TableCell>
        <TieneImagen si={entrada.tieneImagen} />
      </TableCell>
      <TableCell>
        <Visible publicada={entrada.publicada} />
      </TableCell>
      <TableCell>
        <Acciones {...props} />
      </TableCell>
    </TableRow>
  );
}

function TarjetaEntrada(props: FilaProps) {
  const { entrada, marcada, editando } = props;

  return (
    <li
      className={cn(
        'flex gap-3 p-4',
        marcada && 'bg-primary-soft/40',
        editando && 'border-l-4 border-l-primary',
      )}
    >
      <div className="pt-1">
        <Marcar {...props} />
      </div>
      {editando ? (
        <EdicionRapida
          entrada={entrada}
          onCancelar={props.onCancelar}
          onGuardado={props.onGuardado}
          className="min-w-0 flex-1"
        />
      ) : (
        <>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <Ingles className="block text-lg font-semibold [overflow-wrap:anywhere]">
                {entrada.ingles}
              </Ingles>
              <p className="text-base [overflow-wrap:anywhere]">{entrada.espanol}</p>
              <p className="text-sm text-muted-foreground">
                {[
                  `Módulo ${entrada.modulo.numero}`,
                  entrada.unidad?.codigo,
                  entrada.categoria.nombre,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ChipTipo tipo={entrada.tipo} />
              <EstadoSena
                vista="admin"
                estado={entrada.sena.estado}
                className="px-2 py-0.5 text-sm"
              />
              <Visible publicada={entrada.publicada} />
              <span className="text-sm">
                Imagen: <TieneImagen si={entrada.tieneImagen} />
              </span>
            </div>
          </div>
          <Acciones {...props} />
        </>
      )}
    </li>
  );
}
