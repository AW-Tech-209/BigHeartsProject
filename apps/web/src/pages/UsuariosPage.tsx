import type { AdminUsuarioItem, AdminUsuariosQuery, CuentaCreadaResponse } from '@academia/types';
import { LoaderCircle, RotateCw, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { CrearCuentaForm } from '@/features/admin/components/crear-cuenta-form';
import { CredencialesDialog } from '@/features/admin/components/credenciales-dialog';
import { FiltrosUsuarios } from '@/features/admin/components/filtros-usuarios';
import { ListaUsuarios } from '@/features/admin/components/lista-usuarios';
import { useAdminUsuarios, useGenerarContrasena } from '@/features/admin/hooks/use-usuarios';
import {
  buildAdminUsuariosSearchParams,
  hayFiltrosDeUsuarios,
  parseAdminUsuariosQuery,
} from '@/features/admin/lib/filtros-usuarios';
import { useAnnounce } from '@/hooks/use-announce';

/**
 * Usuarios de la academia: lista con filtros en la URL y alta de cuentas.
 * La contraseña temporal solo vive en el estado de esta pantalla mientras el
 * diálogo está abierto; nunca en la caché de React Query ni en `localStorage`.
 */
export function UsuariosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseAdminUsuariosQuery(searchParams);
  const { data, isPending, isError, refetch, isRefetching } = useAdminUsuarios(query);
  const generar = useGenerarContrasena();
  const announce = useAnnounce();

  const [creando, setCreando] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [cuenta, setCuenta] = useState<CuentaCreadaResponse | null>(null);
  const [errorRegenerar, setErrorRegenerar] = useState(false);

  const hayFiltro = hayFiltrosDeUsuarios(query);

  useEffect(() => {
    if (!data) return;
    announce(
      data.total === 0
        ? 'No hay usuarios con ese filtro.'
        : `Se encontraron ${data.total} usuario${data.total === 1 ? '' : 's'}.`,
    );
  }, [data, announce]);

  function actualizarFiltro(siguiente: AdminUsuariosQuery) {
    setSearchParams(buildAdminUsuariosSearchParams(siguiente));
  }

  function cuentaLista(nueva: CuentaCreadaResponse) {
    setFormKey((k) => k + 1);
    setCuenta(nueva);
  }

  function crearOtra() {
    setCuenta(null);
    setCreando(true);
    requestAnimationFrame(() => document.getElementById('usuario-firstName')?.focus());
  }

  async function regenerar(usuario: AdminUsuarioItem) {
    setErrorRegenerar(false);
    try {
      await generar.mutateAsync({ variables: usuario.id, onCuenta: setCuenta });
    } catch {
      setErrorRegenerar(true);
    }
  }

  const paginaActual = query.page ?? 1;
  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Usuarios"
        contexto="Crea cuentas de estudiantes y profesores, y genera una contraseña nueva cuando alguien la pierda."
        accion={
          !creando && (
            <Button onClick={() => setCreando(true)} className="h-12 gap-2 px-5 text-base">
              <UserPlus aria-hidden="true" strokeWidth={2} className="size-5" />
              Crear cuenta
            </Button>
          )
        }
      />

      {creando && (
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium">Crear cuenta</h2>
            <Button
              variant="outline"
              onClick={() => setCreando(false)}
              className="h-11 px-4 text-base"
            >
              Cancelar
            </Button>
          </div>
          <CrearCuentaForm key={formKey} onCreada={cuentaLista} />
        </Card>
      )}

      {errorRegenerar && (
        <Callout variant="destructive" live="assertive" title="No pudimos generar la contraseña">
          <p>No se hizo ningún cambio. Revisa tu conexión e inténtalo otra vez.</p>
        </Callout>
      )}

      <FiltrosUsuarios key={query.q ?? ''} value={query} onChange={actualizarFiltro} />

      {isPending && (
        <p role="status" className="flex items-center gap-3 py-12 text-base text-muted-foreground">
          <LoaderCircle
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 shrink-0 animate-spin"
          />
          Cargando los usuarios…
        </p>
      )}

      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar los usuarios">
          <div className="space-y-4">
            <p>Revisa tu conexión e inténtalo otra vez.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="h-11 gap-2 px-5 text-base"
            >
              <RotateCw aria-hidden="true" strokeWidth={2} className="size-5" />
              Volver a cargar
            </Button>
          </div>
        </Callout>
      )}

      {data && data.items.length === 0 && (
        <EstadoVacio
          titular={hayFiltro ? 'No hay usuarios con ese filtro' : 'Todavía no hay usuarios'}
          ayuda={
            hayFiltro
              ? 'Prueba con otro rol, estado o búsqueda.'
              : 'Crea la primera cuenta con el botón «Crear cuenta».'
          }
          accion={
            hayFiltro ? (
              <Button variant="outline" onClick={() => actualizarFiltro({})}>
                Quitar filtros
              </Button>
            ) : undefined
          }
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <ListaUsuarios
            items={data.items}
            total={data.total}
            regenerando={generar.isPending}
            onRegenerar={regenerar}
          />

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación de usuarios"
              className="flex items-center justify-center gap-4 border-t border-border pt-6"
            >
              <Button
                variant="outline"
                disabled={paginaActual <= 1}
                onClick={() => actualizarFiltro({ ...query, page: paginaActual - 1 })}
              >
                Anterior
              </Button>
              <p className="text-sm text-muted-foreground">
                Página {paginaActual} de {totalPaginas}
              </p>
              <Button
                variant="outline"
                disabled={paginaActual >= totalPaginas}
                onClick={() => actualizarFiltro({ ...query, page: paginaActual + 1 })}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}

      {cuenta && (
        <CredencialesDialog
          key={cuenta.caducaEl + cuenta.usuario.id}
          cuenta={cuenta}
          onClose={() => setCuenta(null)}
          onCrearOtra={crearOtra}
        />
      )}
    </AppShell>
  );
}
