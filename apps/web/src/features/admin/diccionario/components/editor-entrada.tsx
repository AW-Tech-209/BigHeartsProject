import type { EntradaAdmin } from '@academia/types';
import { TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  PanelLateral,
  PanelLateralContenido,
  PanelLateralTitulo,
} from '@/components/ui/panel-lateral';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCategoriasAdmin,
  useEntradaAdmin,
  useModulosAdmin,
} from '../hooks/use-admin-diccionario';
import { FormularioEntrada } from './formulario-entrada';

type CuerpoEditorProps = {
  id?: string;
  onGuardada: (entrada: EntradaAdmin, creaOtra: boolean) => void;
  onCancelar: () => void;
  onSucio: (sucio: boolean) => void;
  onPapelera?: (entrada: EntradaAdmin) => void;
  pieClassName?: string;
};

/** Carga lo que el formulario necesita y lo pinta; lo usan el panel y la página. */
export function CuerpoEditor({ id, ...props }: CuerpoEditorProps) {
  const modulos = useModulosAdmin();
  const categorias = useCategoriasAdmin();
  const entrada = useEntradaAdmin(id);

  const cargando = modulos.isPending || categorias.isPending || (Boolean(id) && entrada.isPending);
  const fallo = modulos.isError || categorias.isError || entrada.isError;

  if (fallo) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-base">
          No pudimos cargar la entrada. Revisa tu conexión e inténtalo de nuevo.
        </p>
        <Button
          variant="outline"
          className="h-11 px-4"
          onClick={() => {
            void modulos.refetch();
            void categorias.refetch();
            if (id) void entrada.refetch();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (cargando) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Cargando el editor…</span>
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <FormularioEntrada
      key={entrada.data?.id ?? 'nueva'}
      entrada={entrada.data}
      modulos={modulos.data?.modulos ?? []}
      categorias={categorias.data?.categorias ?? []}
      {...props}
    />
  );
}

/** Se pregunta dentro del mismo panel o página: nunca un segundo modal encima. */
export function ConfirmarSalida({
  onSeguir,
  onSalir,
}: {
  onSeguir: () => void;
  onSalir: () => void;
}) {
  const seguir = useRef<HTMLButtonElement>(null);
  useEffect(() => seguir.current?.focus(), []);

  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-attention-border bg-attention-soft p-4"
    >
      <p className="flex items-center gap-2 text-base font-medium text-attention-soft-foreground">
        <TriangleAlert aria-hidden="true" strokeWidth={2} className="size-5" />
        Tienes cambios sin guardar o una subida en curso. ¿Salir de todos modos?
      </p>
      <div className="flex flex-wrap gap-3">
        <Button ref={seguir} variant="outline" className="h-11 px-4 text-base" onClick={onSeguir}>
          Seguir editando
        </Button>
        <Button variant="destructive" className="h-11 px-4 text-base" onClick={onSalir}>
          Salir sin guardar
        </Button>
      </div>
    </div>
  );
}

type EditorEntradaProps = {
  /** `null` = cerrado; `{}` = crear; `{ id }` = editar. */
  editor: { id?: string } | null;
  onCerrar: () => void;
  onGuardada: (entrada: EntradaAdmin, creaOtra: boolean) => void;
  onPapelera: (entrada: EntradaAdmin) => void;
};

/** Panel lateral de escritorio: foco atrapado, Esc pide cerrar y el foco vuelve a la fila. */
export function EditorEntrada({ editor, onCerrar, onGuardada, onPapelera }: EditorEntradaProps) {
  const [sucio, setSucio] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const entrada = useEntradaAdmin(editor?.id);

  const cerrar = () => {
    setConfirmando(false);
    setSucio(false);
    onCerrar();
  };
  const pedirCierre = () => (sucio ? setConfirmando(true) : cerrar());

  return (
    <PanelLateral open={editor !== null} onOpenChange={(abierto) => !abierto && pedirCierre()}>
      <PanelLateralContenido>
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {editor?.id ? 'Editar entrada' : 'Crear entrada'}
            </p>
            <PanelLateralTitulo
              className="font-serif text-3xl"
              lang={editor?.id ? 'en' : undefined}
            >
              {editor?.id ? (entrada.data?.ingles ?? 'Entrada') : 'Nueva entrada'}
            </PanelLateralTitulo>
          </div>
          <Button
            variant="outline"
            aria-label="Cerrar el editor"
            className="size-11"
            onClick={pedirCierre}
          >
            <X aria-hidden="true" strokeWidth={2} className="size-5" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {confirmando && (
            <ConfirmarSalida onSeguir={() => setConfirmando(false)} onSalir={cerrar} />
          )}
          {editor && (
            <CuerpoEditor
              key={editor.id ?? 'nueva'}
              id={editor.id}
              onSucio={setSucio}
              onCancelar={pedirCierre}
              onGuardada={(guardada, creaOtra) => {
                onGuardada(guardada, creaOtra);
                if (!creaOtra) cerrar();
              }}
              onPapelera={(e) => {
                cerrar();
                onPapelera(e);
              }}
              pieClassName="sticky bottom-0 -mx-6 -mb-5 bg-background px-6 pb-5"
            />
          )}
        </div>
      </PanelLateralContenido>
    </PanelLateral>
  );
}
