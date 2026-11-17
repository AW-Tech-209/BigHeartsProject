import type { EntradaPapelera } from '@academia/types';
import { Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
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
import { Skeleton } from '@/components/ui/skeleton';
import { type Aviso, AvisoDeshacer } from '@/features/admin/diccionario/components/aviso-deshacer';
import { FilaPapelera } from '@/features/admin/diccionario/components/fila-papelera';
import {
  useCategoriasAdmin,
  useModulosAdmin,
  usePapelera,
  useVaciarPapelera,
} from '@/features/admin/diccionario/hooks/use-admin-diccionario';
import { Migas } from '@/features/diccionario/components/migas';

export function AdminPapeleraPage() {
  const papelera = usePapelera();
  const modulos = useModulosAdmin();
  const categorias = useCategoriasAdmin();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [ahora] = useState(() => new Date());
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const avisar = (mensaje: string) => setAviso({ id: Date.now(), mensaje });

  const datos = papelera.data;
  const dias = datos?.diasDeRetencion ?? 30;

  return (
    <AppShell>
      <Migas pasos={[{ texto: 'Diccionario', to: '/admin/diccionario' }, { texto: 'Papelera' }]} />
      <PaginaCabecera
        titulo="Papelera"
        tituloDocumento="Papelera · Diccionario"
        contexto={`Las entradas se guardan aquí ${dias} días. Después se eliminan para siempre.`}
        accion={
          datos && datos.entradas.length > 0 ? (
            <VaciarPapelera
              cantidad={datos.entradas.length}
              onVaciada={(n) =>
                avisar(`${n} ${n === 1 ? 'entrada eliminada' : 'entradas eliminadas'} para siempre`)
              }
            />
          ) : undefined
        }
      />

      {!datos ? (
        papelera.isError ? (
          <EstadoVacio
            ilustracion="error"
            titular="No pudimos cargar la papelera."
            ayuda="Revisa tu conexión e inténtalo de nuevo."
            accion={
              <Button
                variant="outline"
                className="h-11 px-4"
                onClick={() => void papelera.refetch()}
              >
                Reintentar
              </Button>
            }
          />
        ) : (
          <div role="status" className="space-y-2">
            <span className="sr-only">Cargando la papelera…</span>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )
      ) : datos.entradas.length === 0 ? (
        <EstadoVacio
          titular="La papelera está vacía."
          ayuda="Lo que envíes a la papelera desde la consola se guarda aquí antes de eliminarse."
          accion={
            <Button
              render={<Link to="/admin/diccionario" />}
              variant="outline"
              className="h-11 px-4"
            >
              Volver a la consola
            </Button>
          }
        />
      ) : (
        <section aria-labelledby="titulo-papelera" className="space-y-3">
          <h2 id="titulo-papelera" className="text-base">
            <strong>
              {datos.entradas.length} {datos.entradas.length === 1 ? 'entrada' : 'entradas'}
            </strong>{' '}
            en la papelera
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {datos.entradas.map((entrada: EntradaPapelera) => (
              <FilaPapelera
                key={entrada.id}
                entrada={entrada}
                modulos={modulos.data?.modulos ?? []}
                categorias={categorias.data?.categorias ?? []}
                ahora={ahora}
                onRestaurada={(e) => avisar(`${e.ingles} restaurada`)}
                onEliminada={(e) => avisar(`${e.ingles} eliminada para siempre`)}
              />
            ))}
          </ul>
        </section>
      )}

      <AvisoDeshacer aviso={aviso} onCerrar={cerrarAviso} />
    </AppShell>
  );
}

function VaciarPapelera({
  cantidad,
  onVaciada,
}: {
  cantidad: number;
  onVaciada: (n: number) => void;
}) {
  const volver = useRef<HTMLButtonElement>(null);
  const vaciar = useVaciarPapelera();
  const [abierto, setAbierto] = useState(false);

  async function confirmar() {
    try {
      const { eliminadas } = await vaciar.mutateAsync();
      setAbierto(false);
      onVaciada(eliminadas);
    } catch {
      // El error queda escrito en el diálogo.
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={(s) => !vaciar.isPending && setAbierto(s)}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            className="h-12 gap-2 border border-destructive/40 px-5 text-base"
          />
        }
      >
        <Trash2 aria-hidden="true" strokeWidth={2} className="size-5" />
        Vaciar papelera
      </AlertDialogTrigger>
      <AlertDialogContent initialFocus={volver}>
        <AlertDialogTitle>{`¿Eliminar para siempre las ${cantidad} entradas de la papelera?`}</AlertDialogTitle>
        <AlertDialogDescription>
          Se borran con sus señas e imágenes. Esto no se puede deshacer.
        </AlertDialogDescription>
        {vaciar.isError && (
          <p role="alert" className="text-base text-destructive">
            No pudimos vaciarla. Inténtalo de nuevo.
          </p>
        )}
        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={volver} className="h-11 px-5 text-base" />}
            disabled={vaciar.isPending}
          >
            Volver
          </AlertDialogClose>
          <Button
            variant="destructive"
            disabled={vaciar.isPending}
            className="h-11 px-5 text-base"
            onClick={() => void confirmar()}
          >
            {vaciar.isPending ? 'Eliminando…' : `Eliminar ${cantidad} entradas`}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
