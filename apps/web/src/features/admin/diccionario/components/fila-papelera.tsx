import {
  ApiErrorCode,
  type CategoriaAdmin,
  type DestinoFaltante,
  type EntradaPapelera,
  type ModuloAdmin,
} from '@academia/types';
import { Clock, LoaderCircle, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Ingles } from '@/components/dominio/ingles';
import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { ApiClientError } from '@/lib/api-error';
import { useEliminarParaSiempre, useRestaurarEntradas } from '../hooks/use-admin-diccionario';

const FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const DIAS_AVISO = 3;

type FilaPapeleraProps = {
  entrada: EntradaPapelera;
  modulos: ModuloAdmin[];
  categorias: CategoriaAdmin[];
  ahora: Date;
  onRestaurada: (entrada: EntradaPapelera) => void;
  onEliminada: (entrada: EntradaPapelera) => void;
};

export function FilaPapelera({
  entrada,
  modulos,
  categorias,
  ahora,
  onRestaurada,
  onEliminada,
}: FilaPapeleraProps) {
  const id = useId();
  const restaurar = useRestaurarEntradas();
  const [faltante, setFaltante] = useState<DestinoFaltante | null>(null);
  const [categoriaId, setCategoriaId] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const seElimina = new Date(ahora.getTime() + entrada.quedanDias * 86_400_000);
  const urgente = entrada.quedanDias <= DIAS_AVISO;
  const unidadesDelModulo = modulos.find((m) => m.numero === entrada.modulo.numero)?.unidades ?? [];
  const estabaEn = [
    `Módulo ${entrada.modulo.numero}`,
    entrada.unidad && `Unidad ${entrada.unidad.codigo.slice(1)}`,
    entrada.categoria.nombre,
  ]
    .filter(Boolean)
    .join(' · ');

  async function alRestaurar() {
    setError(null);
    if (faltante && ((faltante.categoria && !categoriaId) || (faltante.unidad && !unidadId))) {
      setError('Elige a dónde moverla antes de restaurar.');
      return;
    }
    try {
      await restaurar.mutateAsync({
        ids: [entrada.id],
        input: faltante
          ? {
              ...(faltante.categoria ? { categoriaId } : {}),
              ...(faltante.unidad ? { unidadId: unidadId === 'sin' ? null : unidadId } : {}),
            }
          : {},
      });
      onRestaurada(entrada);
    } catch (e) {
      if (e instanceof ApiClientError && e.code === ApiErrorCode.RESTORE_TARGET_MISSING) {
        setFaltante((e.details ?? {}) as DestinoFaltante);
      } else {
        setError(e instanceof Error ? e.message : 'No pudimos restaurarla. Inténtalo de nuevo.');
      }
    }
  }

  return (
    <li className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[2fr_2fr_1.3fr_auto] lg:items-center">
      <div className="min-w-0">
        <Ingles className="block text-lg font-semibold [overflow-wrap:anywhere]">
          {entrada.ingles}
        </Ingles>
        <p className="text-base">{entrada.espanol}</p>
        <p className="text-sm text-muted-foreground">
          Enviada el {FECHA.format(new Date(entrada.eliminadaEl))}
        </p>
      </div>
      <p className="text-base">
        <span className="text-sm text-muted-foreground lg:sr-only">Estaba en: </span>
        {estabaEn}
      </p>
      <div className="space-y-1">
        <p className="text-base">
          <span className="text-sm text-muted-foreground lg:sr-only">Se elimina el </span>
          {FECHA.format(seElimina)}
        </p>
        <Badge
          tono={urgente ? 'attention' : 'neutral'}
          icon={urgente ? TriangleAlert : Clock}
          className="px-2 py-0.5 text-sm"
        >
          {entrada.quedanDias === 0
            ? 'Se elimina hoy'
            : `Quedan ${entrada.quedanDias} ${entrada.quedanDias === 1 ? 'día' : 'días'}`}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={restaurar.isPending}
          className="h-11 gap-2 px-4 text-base"
          onClick={() => void alRestaurar()}
        >
          {restaurar.isPending ? (
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-4 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" strokeWidth={2} className="size-4" />
          )}
          {restaurar.isPending ? 'Restaurando…' : faltante ? 'Restaurar aquí' : 'Restaurar'}
          <span className="sr-only"> {entrada.ingles}</span>
        </Button>
        <EliminarParaSiempre entrada={entrada} onEliminada={onEliminada} />
      </div>

      {faltante && (
        <div className="space-y-3 rounded-lg border border-info/30 bg-info-soft p-4 lg:col-span-4">
          <p role="alert" className="text-base">
            {faltante.categoria && `Su categoría «${faltante.categoria.nombre}» ya no existe. `}
            {faltante.unidad &&
              `Su unidad «${faltante.unidad.codigo} · ${faltante.unidad.nombre}» ya no existe. `}
            Elige a dónde moverla y pulsa «Restaurar aquí».
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {faltante.categoria && (
              <div className="space-y-1">
                <label htmlFor={`${id}-categoria`} className="block text-base font-medium">
                  Categoría nueva
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
            )}
            {faltante.unidad && (
              <div className="space-y-1">
                <label htmlFor={`${id}-unidad`} className="block text-base font-medium">
                  Unidad nueva
                </label>
                <NativeSelect
                  id={`${id}-unidad`}
                  value={unidadId}
                  onChange={(e) => setUnidadId(e.target.value)}
                >
                  <option value="">Elige una unidad</option>
                  <option value="sin">Sin unidad</option>
                  {unidadesDelModulo.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unidad {u.codigo.slice(1)} · {u.nombre}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-base text-destructive lg:col-span-4">
          {error}
        </p>
      )}
    </li>
  );
}

function EliminarParaSiempre({
  entrada,
  onEliminada,
}: Pick<FilaPapeleraProps, 'entrada' | 'onEliminada'>) {
  const volver = useRef<HTMLButtonElement>(null);
  const eliminar = useEliminarParaSiempre();
  const [abierto, setAbierto] = useState(false);

  async function confirmar() {
    try {
      await eliminar.mutateAsync(entrada.id);
      setAbierto(false);
      onEliminada(entrada);
    } catch {
      // El error queda escrito en el diálogo.
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={(s) => !eliminar.isPending && setAbierto(s)}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            className="h-11 gap-2 border border-destructive/40 px-4 text-base"
          />
        }
      >
        <Trash2 aria-hidden="true" strokeWidth={2} className="size-4" />
        Eliminar para siempre
        <span className="sr-only"> {entrada.ingles}</span>
      </AlertDialogTrigger>
      <AlertDialogContent initialFocus={volver}>
        <AlertDialogTitle>{`¿Eliminar «${entrada.ingles}» para siempre?`}</AlertDialogTitle>
        <AlertDialogDescription>
          Se borran la entrada, su seña y su imagen. Esto no se puede deshacer.
        </AlertDialogDescription>
        {eliminar.isError && (
          <p role="alert" className="text-base text-destructive">
            No pudimos eliminarla. Inténtalo de nuevo.
          </p>
        )}
        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={volver} className="h-11 px-5 text-base" />}
            disabled={eliminar.isPending}
          >
            Volver
          </AlertDialogClose>
          <Button
            variant="destructive"
            disabled={eliminar.isPending}
            className="h-11 px-5 text-base"
            onClick={() => void confirmar()}
          >
            {eliminar.isPending ? 'Eliminando…' : 'Eliminar para siempre'}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
