import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { type Aviso, AvisoDeshacer } from '@/features/admin/diccionario/components/aviso-deshacer';
import {
  ConfirmarSalida,
  CuerpoEditor,
} from '@/features/admin/diccionario/components/editor-entrada';
import {
  useEnviarAPapelera,
  useEntradaAdmin,
} from '@/features/admin/diccionario/hooks/use-admin-diccionario';
import { mensajeGuardada } from '@/features/admin/diccionario/lib/mensajes';

/** El editor como página: en móvil y cuando se entra por un enlace directo. */
export function AdminEntradaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const entrada = useEntradaAdmin(id);
  const papelera = useEnviarAPapelera();
  const [sucio, setSucio] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  const volver = (state?: object) => navigate('/admin/diccionario', { state });
  const titulo = id ? (entrada.data?.ingles ?? 'Entrada') : 'Nueva entrada';

  return (
    <AppShell>
      <Link
        to="/admin/diccionario"
        className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
        Volver a la consola
      </Link>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{id ? 'Editar entrada' : 'Crear entrada'}</p>
        <div lang={id ? 'en' : undefined}>
          <PaginaCabecera titulo={titulo} tituloDocumento={`${titulo} · Diccionario`} />
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {confirmando && (
          <ConfirmarSalida onSeguir={() => setConfirmando(false)} onSalir={() => volver()} />
        )}
        <CuerpoEditor
          id={id}
          onSucio={setSucio}
          onCancelar={() => (sucio ? setConfirmando(true) : volver())}
          onGuardada={(guardada, creaOtra) => {
            if (creaOtra) setAviso({ id: Date.now(), mensaje: mensajeGuardada(guardada) });
            else volver({ aviso: mensajeGuardada(guardada) });
          }}
          onPapelera={(e) =>
            void papelera
              .mutateAsync(e.id)
              .then(() => volver({ enviada: { id: e.id, ingles: e.ingles } }))
              .catch(() =>
                setAviso({
                  id: Date.now(),
                  mensaje: 'No pudimos enviarla a la papelera. Inténtalo de nuevo.',
                }),
              )
          }
        />
      </div>

      <AvisoDeshacer aviso={aviso} onCerrar={cerrarAviso} />
    </AppShell>
  );
}
