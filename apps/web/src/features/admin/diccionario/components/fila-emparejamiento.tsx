import type { EntradaAdmin } from '@academia/types';
import {
  ArrowRight,
  Ban,
  CircleAlert,
  CircleCheck,
  Clock,
  FileVideo,
  Hourglass,
  Link2Off,
  LoaderCircle,
  type LucideIcon,
  Upload,
} from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import type { EstadoFila, FilaCola } from '../lib/cola-subida';
import { claveDeNombre, type Emparejamiento } from '../lib/emparejar-archivos';
import { formatoMb } from '../lib/validar-video';

export type EntradaCola = EntradaAdmin & { conSena: boolean };
export type MetaFila = { emparejamiento: Emparejamiento<EntradaCola> };

type Tono = 'neutral' | 'info' | 'attention' | 'success' | 'destructive';

const ESTADOS: Record<EstadoFila, { texto: string; icono: LucideIcon; tono: Tono }> = {
  validando: { texto: 'Revisando', icono: LoaderCircle, tono: 'neutral' },
  'sin-entrada': { texto: 'Sin emparejar', icono: Link2Off, tono: 'info' },
  'en-espera': { texto: 'En espera', icono: Clock, tono: 'neutral' },
  subiendo: { texto: 'Subiendo', icono: Upload, tono: 'attention' },
  procesando: { texto: 'Procesando', icono: Hourglass, tono: 'attention' },
  lista: { texto: 'Lista', icono: CircleCheck, tono: 'success' },
  error: { texto: 'Error', icono: CircleAlert, tono: 'destructive' },
  cancelada: { texto: 'Cancelada', icono: Ban, tono: 'neutral' },
};

const ubicacion = (e: EntradaAdmin) =>
  [
    `Módulo ${e.modulo.numero}`,
    e.unidad && `Unidad ${e.unidad.codigo.slice(1)}`,
    e.categoria.nombre,
  ]
    .filter(Boolean)
    .join(' · ');

type FilaEmparejamientoProps = {
  fila: FilaCola<MetaFila>;
  entradas: EntradaCola[];
  onAsignar: (entrada: EntradaCola) => void;
  onReemplazarArchivo: (archivo: File) => void;
};

export function FilaEmparejamiento({
  fila,
  entradas,
  onAsignar,
  onReemplazarArchivo,
}: FilaEmparejamientoProps) {
  const { emparejamiento } = fila.meta;
  const entrada = fila.entradaId ? entradas.find((e) => e.id === fila.entradaId) : undefined;
  const { texto, icono, tono } = ESTADOS[fila.estado];

  return (
    <li
      className={cn(
        'grid gap-3 border-l-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)_auto] sm:items-center',
        fila.estado === 'error'
          ? 'border-l-destructive bg-destructive-soft/40'
          : fila.estado === 'sin-entrada'
            ? 'border-l-info bg-info-soft/40'
            : 'border-l-transparent',
      )}
    >
      <p className="flex min-w-0 items-center gap-2">
        <FileVideo aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
        <code className="truncate text-base">{fila.archivo.name}</code>
      </p>
      <ArrowRight
        aria-hidden="true"
        strokeWidth={2}
        className="hidden size-4 text-muted-foreground sm:block"
      />
      <div className="min-w-0">
        {entrada ? (
          <>
            <p lang="en" className="text-base font-semibold [overflow-wrap:anywhere]">
              {entrada.ingles}
            </p>
            <p className="text-sm text-muted-foreground">{ubicacion(entrada)}</p>
            {entrada.conSena && fila.estado !== 'lista' && (
              <p className="text-sm text-muted-foreground">Reemplaza la seña actual.</p>
            )}
          </>
        ) : fila.estado === 'sin-entrada' ? (
          <SelectorEntrada
            archivo={fila.archivo.name}
            emparejamiento={emparejamiento}
            entradas={entradas}
            onElegir={onAsignar}
          />
        ) : (
          <p className="text-base text-muted-foreground">
            {emparejamiento.estado === 'sin-emparejar' || emparejamiento.estado === 'ambigua'
              ? 'Se elige la entrada al terminar de revisarlo.'
              : '—'}
          </p>
        )}
      </div>
      <div className="flex justify-start sm:justify-end">
        <Badge tono={tono} icon={icono} className="px-2 py-0.5 text-sm">
          {texto}
        </Badge>
      </div>

      {(fila.estado === 'subiendo' || fila.estado === 'procesando') && (
        <div className="flex items-center gap-3 sm:col-span-4">
          <div
            role="progressbar"
            aria-label={`Subida de ${fila.archivo.name}`}
            aria-valuemin={0}
            aria-valuemax={fila.total || 1}
            aria-valuenow={fila.subidos}
            aria-valuetext={`${formatoMb(fila.subidos)} de ${formatoMb(fila.total)}`}
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-attention"
              style={{ width: `${fila.total ? (fila.subidos / fila.total) * 100 : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {formatoMb(fila.subidos)} de {formatoMb(fila.total)}
          </span>
        </div>
      )}

      {fila.estado === 'error' && fila.motivo && (
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-4">
          <p role="alert" className="flex items-start gap-2 text-base text-destructive">
            <CircleAlert aria-hidden="true" strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            {fila.motivo}
          </p>
          <ReemplazarArchivo nombre={fila.archivo.name} onElegir={onReemplazarArchivo} />
        </div>
      )}
    </li>
  );
}

function ReemplazarArchivo({
  nombre,
  onElegir,
}: {
  nombre: string;
  onElegir: (archivo: File) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept="video/mp4"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) onElegir(archivo);
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        className="h-11 px-4 text-base"
        onClick={() => entrada.current?.click()}
      >
        Reemplazar archivo<span className="sr-only"> {nombre}</span>
      </Button>
    </>
  );
}

function SelectorEntrada({
  archivo,
  emparejamiento,
  entradas,
  onElegir,
}: {
  archivo: string;
  emparejamiento: Emparejamiento<EntradaCola>;
  entradas: EntradaCola[];
  onElegir: (entrada: EntradaCola) => void;
}) {
  const id = useId();
  const [busqueda, setBusqueda] = useState('');
  const ambigua = emparejamiento.estado === 'ambigua';
  const sugerencia = emparejamiento.estado === 'sin-emparejar' ? emparejamiento.sugerencia : null;

  const opciones = useMemo(() => {
    if (ambigua) return emparejamiento.candidatas;
    const clave = claveDeNombre(busqueda);
    return clave
      ? entradas.filter((e) => claveDeNombre(`${e.ingles} ${e.espanol}`).includes(clave))
      : entradas;
  }, [ambigua, emparejamiento, entradas, busqueda]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {ambigua
          ? 'Hay varias entradas con este nombre: elige el módulo.'
          : sugerencia
            ? 'No hay una entrada con este nombre.'
            : 'Elige a qué entrada pertenece.'}
      </p>
      {!ambigua && (
        <>
          <label htmlFor={`${id}-buscar`} className="sr-only">
            Buscar la entrada de {archivo}
          </label>
          <Input
            id={`${id}-buscar`}
            type="search"
            placeholder="Buscar en inglés o español"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </>
      )}
      <label htmlFor={`${id}-entrada`} className="sr-only">
        Entrada de {archivo}
      </label>
      <NativeSelect
        id={`${id}-entrada`}
        value=""
        onChange={(e) => {
          const elegida = entradas.find((x) => x.id === e.target.value);
          if (elegida) onElegir(elegida);
        }}
      >
        <option value="">
          {opciones.length === 0 ? 'Ninguna coincide con la búsqueda' : 'Elige la entrada…'}
        </option>
        {opciones.slice(0, 200).map((e) => (
          <option key={e.id} value={e.id}>
            {e.ingles} · {ubicacion(e)}
          </option>
        ))}
      </NativeSelect>
      {sugerencia && (
        <p className="flex flex-wrap items-center gap-2 text-base">
          ¿Quisiste decir <strong lang="en">{sugerencia.ingles}</strong>?
          <Button
            variant="outline"
            className="h-11 px-4 text-base"
            onClick={() => onElegir(sugerencia)}
          >
            Usar «{sugerencia.ingles}»
          </Button>
        </p>
      )}
    </div>
  );
}
