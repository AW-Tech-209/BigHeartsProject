import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListaCategorias } from '@/features/admin/diccionario/components/lista-categorias';
import { ListaModulos } from '@/features/admin/diccionario/components/lista-modulos';
import {
  useCategoriasAdmin,
  useModulosAdmin,
} from '@/features/admin/diccionario/hooks/use-admin-diccionario';
import { Migas } from '@/features/diccionario/components/migas';

export function AdminEstructuraPage() {
  const modulos = useModulosAdmin();
  const categorias = useCategoriasAdmin();
  const error = modulos.isError || categorias.isError;

  return (
    <AppShell>
      <Migas
        pasos={[{ texto: 'Diccionario', to: '/admin/diccionario' }, { texto: 'Estructura' }]}
      />
      <PaginaCabecera
        titulo="Estructura"
        tituloDocumento="Estructura · Diccionario"
        contexto="Módulos, unidades y categorías. Usa las flechas para cambiar el orden."
      />

      {error ? (
        <EstadoVacio
          ilustracion="error"
          titular="No pudimos cargar la estructura."
          ayuda="Revisa tu conexión e inténtalo de nuevo."
          accion={
            <Button
              variant="outline"
              className="h-11 px-4"
              onClick={() => {
                void modulos.refetch();
                void categorias.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        />
      ) : !modulos.data || !categorias.data ? (
        <div role="status" className="grid gap-6 lg:grid-cols-2">
          <span className="sr-only">Cargando la estructura…</span>
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ListaModulos modulos={modulos.data.modulos} />
          <ListaCategorias categorias={categorias.data.categorias} />
        </div>
      )}
    </AppShell>
  );
}
